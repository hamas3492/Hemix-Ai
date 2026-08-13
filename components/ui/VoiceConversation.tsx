"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceConversationProps {
  onClose: () => void;
  messages: Array<{ role: string; content: string }>;
  onUserMessage: (text: string) => void;
  onAIResponse: (text: string) => void;
  systemPrompt: string;
}

type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

export function VoiceConversation({
  onClose, messages, onUserMessage, onAIResponse, systemPrompt,
}: VoiceConversationProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const isProcessing = useRef(false); // Prevents double recording/speaking
  const messagesRef = useRef(messages);
  const systemPromptRef = useRef(systemPrompt);
  const mutedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { systemPromptRef.current = systemPrompt; }, [systemPrompt]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // --- Speak function (uses custom voice file if available, else best browser voice) ---
  const speakText = useCallback((text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onDone();
      return;
    }

    const clean = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[*#`_>|]/g, "").trim();
    if (!clean) { onDone(); return; }

    // Cancel any existing speech to prevent double audio
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();

    // Pick the best natural-sounding voice available
    const preferredVoice =
      voices.find(v => /google.*us.*english/i.test(v.name)) ||
      voices.find(v => /google.*english/i.test(v.name)) ||
      voices.find(v => /samantha|alex|daniel|karen|moira|tessa|fiona|serena|aaron|nicky/i.test(v.name)) ||
      voices.find(v => v.lang === "en-US" && /natural|enhanced|premium/i.test(v.name)) ||
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang.startsWith("en"));

    if (preferredVoice) utter.voice = preferredVoice;
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    let doneCalled = false;
    const callDone = () => {
      if (!doneCalled) { doneCalled = true; onDone(); }
    };

    utter.onend = callDone;
    utter.onerror = callDone;

    setState("speaking");
    // Small delay after cancel to ensure clean playback
    setTimeout(() => {
      if (isMounted.current) window.speechSynthesis.speak(utter);
      else callDone();
    }, 50);
  }, []);

  // --- Handle user speech → API → AI speaks ---
  const handleUserStop = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing.current) return;

    isProcessing.current = true;

    // Stop recognition immediately
    try { recognitionRef.current?.stop(); } catch {}
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }

    onUserMessage(text);
    setState("thinking");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "hemix-1",
          messages: [
            { role: "system", content: systemPromptRef.current },
            ...messagesRef.current.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
          temperature: 0.7,
          maxTokens: 4096, // Reduced from 16384 for faster responses
        }),
      });

      if (!response.ok) throw new Error("API error");

      // Read full response (non-streaming for speed in voice mode)
      const data = await response.json().catch(() => null);
      let fullText = "";

      if (data) {
        // Try JSON response first
        fullText = data.choices?.[0]?.message?.content || data.content || "";
      }

      if (!fullText) {
        // Fall back to streaming
        const reader = response.body?.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]" || !trimmed.startsWith("data: ")) continue;
              try {
                const d = JSON.parse(trimmed.slice(6));
                const delta = d.choices?.[0]?.delta?.content;
                if (delta) fullText += delta;
              } catch { continue; }
            }
          }
        }
      }

      if (fullText && isMounted.current) {
        onAIResponse(fullText);

        if (!mutedRef.current) {
          speakText(fullText, () => {
            if (!isMounted.current) return;
            // After speaking, go back to listening
            isProcessing.current = false;
            setState("listening");
            try { recognitionRef.current?.start(); } catch {}
          });
        } else {
          // Muted — skip speaking, go back to listening
          isProcessing.current = false;
          setState("listening");
          try { recognitionRef.current?.start(); } catch {}
        }
      } else if (isMounted.current) {
        isProcessing.current = false;
        setState("idle");
      }
    } catch {
      if (isMounted.current) {
        isProcessing.current = false;
        setState("idle");
      }
    }
  }, [onUserMessage, onAIResponse, speakText]);

  // Keep handleUserStop in a ref so onresult always has the latest version
  const handleUserStopRef = useRef(handleUserStop);
  useEffect(() => { handleUserStopRef.current = handleUserStop; }, [handleUserStop]);

  // --- Setup speech recognition (once) ---
  useEffect(() => {
    isMounted.current = true;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false; // Changed: non-continuous to prevent double recording
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }

        // Clear and reset silence timer — 1.2s for faster response
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          if (text.trim().length > 0 && !isProcessing.current) {
            handleUserStopRef.current(text.trim());
          }
        }, 1200);
      };

      rec.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setState("error");
          isProcessing.current = false;
        }
      };

      rec.onend = () => {
        // Don't auto-restart here — handleUserStop manages restart after speaking
        // Only restart if we're still in listening state AND not processing
        if (isMounted.current && !isProcessing.current) {
          const currentState = stateRef.current;
          if (currentState === "listening") {
            try { rec.start(); } catch {}
          }
        }
      };

      recognitionRef.current = rec;
    } else {
      setState("error");
    }

    return () => {
      isMounted.current = false;
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      try { recognitionRef.current?.abort(); } catch {}
      try { window.speechSynthesis?.cancel(); } catch {}
    };
  }, []);

  // Keep state in a ref for the onend handler
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // --- Controls ---
  const startListening = useCallback(() => {
    if (!recognitionRef.current) { setState("error"); return; }
    isProcessing.current = false;
    setState("listening");
    try { recognitionRef.current.start(); } catch {}
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    isProcessing.current = false;
    setState("idle");
  }, []);

  const handleInterrupt = useCallback(() => {
    if (state === "speaking") {
      window.speechSynthesis?.cancel();
      isProcessing.current = false;
      startListening();
    } else if (state === "listening") {
      stopListening();
    } else if (state === "idle" || state === "error") {
      startListening();
    }
  }, [state, startListening, stopListening]);

  const handleClose = useCallback(() => {
    try { recognitionRef.current?.abort(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    isProcessing.current = false;
    onClose();
  }, [onClose]);

  // === VISUAL STATE CONFIG ===
  const stateConfig = {
    idle: { text: "Tap to start talking", color: "#3b82f6" },
    listening: { text: "Listening...", color: "#3b82f6" },
    thinking: { text: "Hemix is thinking...", color: "#8b5cf6" },
    speaking: { text: "Hemix is speaking — tap to interrupt", color: "#14b8a6" },
    error: { text: "Microphone access denied. Tap to retry.", color: "#ef4444" },
  };

  const config = stateConfig[state];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-6"
      style={{ background: "rgba(0,0,0,0.85)" }}
    >
      <div
        className="relative flex flex-col items-center justify-between w-full h-full lg:max-w-2xl lg:max-h-[80vh] lg:rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(5,5,5,0.98) 0%, rgba(15,17,21,0.98) 100%)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
      {/* === TOP BAR === */}
      <div className="w-full flex items-center justify-between px-4 py-4">
        {/* End button — red text, no phone icon */}
        <button onClick={handleClose}
          className="px-4 py-2 rounded-xl hover:bg-white/10 transition-colors touch-target no-select"
          aria-label="End conversation">
          <span className="text-sm font-semibold text-red-500">End</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <img src="/assets/icon.png" alt="Hemix" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>Voice Mode</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mute toggle */}
          <button onClick={() => setMuted(!muted)}
            className="p-2.5 rounded-xl glass-strong hover:bg-white/10 transition-colors touch-target no-select"
            style={{ color: "var(--fg)" }} aria-label="Mute/unmute">
            {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* === CENTER: VISUALIZER ONLY (no text/transcript) === */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-2xl">
        {/* Visualizer */}
        <div className="flex items-center justify-center gap-1.5 h-20 mb-4">
          {(state === "listening" || state === "speaking") && (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{ background: config.color }}
                  animate={{
                    height: state === "listening"
                      ? [8, 32, 8]
                      : state === "speaking"
                      ? [12, 40, 12]
                      : 8,
                  }}
                  transition={{
                    duration: state === "speaking" ? 0.4 : 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </>
          )}
          {state === "thinking" && (
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="w-2.5 h-2.5 rounded-full"
                  style={{ background: config.color }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          )}
          {state === "idle" && (
            <motion.div className="w-20 h-20 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: config.color }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
              <Mic className="w-8 h-8" style={{ color: config.color }} />
            </motion.div>
          )}
          {state === "error" && (
            <div className="w-16 h-16 rounded-full border-2 border-red-400 flex items-center justify-center">
              <MicOff className="w-8 h-8 text-red-400" />
            </div>
          )}
        </div>

        {/* State text only — no transcript */}
        <p className="text-center text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
          {config.text}
        </p>
      </div>

      {/* === BOTTOM: MIC BUTTON === */}
      <div className="w-full flex flex-col items-center gap-3 pb-8 px-4">
        <button
          onClick={handleInterrupt}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all touch-target no-select",
            "shadow-2xl",
          )}
          style={{
            background: state === "listening" ? "#3b82f6" : state === "speaking" ? "#14b8a6" : state === "thinking" ? "#8b5cf6" : "rgba(255,255,255,0.05)",
            boxShadow: state !== "idle" && state !== "error" ? `0 0 40px ${config.color}40` : "none",
          }}
          aria-label={state === "speaking" ? "Interrupt and speak" : state === "listening" ? "Stop listening" : "Start talking"}
        >
          {state === "speaking" ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : state === "listening" ? (
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <Mic className="w-8 h-8 text-white" />
            </motion.div>
          ) : state === "thinking" ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white" />
            </motion.div>
          ) : state === "error" ? (
            <Mic className="w-8 h-8" style={{ color: "#ef4444" }} />
          ) : (
            <Mic className="w-8 h-8" style={{ color: "var(--fg)" }} />
          )}
        </button>
        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
          {state === "speaking" ? "Tap to interrupt" : state === "listening" ? "Tap to stop" : "Tap to talk"}
        </p>
      </div>
      </div>
    </motion.div>
  );
}
