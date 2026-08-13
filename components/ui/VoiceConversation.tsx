"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceConversationProps {
  onClose: () => void;
  selectedVoice?: number;
  onVoiceChange?: (v: number) => void;
  messages: Array<{ role: string; content: string }>;
  onUserMessage: (text: string) => void;
  onAIResponse: (text: string) => void;
  systemPrompt: string;
}

type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

export function VoiceConversation({
  onClose, selectedVoice = 0, messages, onUserMessage, onAIResponse, systemPrompt,
}: VoiceConversationProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastUserText, setLastUserText] = useState("");
  const [lastAIText, setLastAIText] = useState("");
  const [muted, setMuted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Setup speech recognition
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setTranscript(text);

        // Clear and reset silence timer
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          if (text.trim().length > 0) {
            handleUserStop(text.trim());
          }
        }, 2000);
      };

      rec.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setState("error");
        }
      };

      rec.onend = () => {
        if (isMounted.current && state === "listening") {
          // Try to restart if we're still in listening state
          try { rec.start(); } catch {}
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

  const startListening = useCallback(() => {
    if (!recognitionRef.current) { setState("error"); return; }
    setTranscript("");
    setState("listening");
    try { recognitionRef.current.start(); } catch {}
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setState("idle");
  }, []);

  // Called when user stops speaking (2s silence)
  const handleUserStop = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try { recognitionRef.current?.stop(); } catch {}
    setLastUserText(text);
    onUserMessage(text);
    setState("thinking");

    // Call the chat API
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "hemix-1",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
          temperature: 0.7,
          maxTokens: 16384,
        }),
      });

      if (!response.ok) throw new Error("API error");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "", fullText = "";

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
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) fullText += delta;
          } catch { continue; }
        }
      }

      if (fullText && isMounted.current) {
        setLastAIText(fullText);
        onAIResponse(fullText);
        // Start speaking
        if (!muted) {
          speakText(fullText);
        } else {
          // If muted, go back to listening
          startListening();
        }
      } else if (isMounted.current) {
        setState("idle");
      }
    } catch {
      if (isMounted.current) {
        setLastAIText("I'm having trouble connecting. Please try again.");
        setState("idle");
      }
    }
  }, [systemPrompt, messages, onUserMessage, onAIResponse, muted, startListening]);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setState("idle");
      return;
    }

    const clean = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[*#`_>|]/g, "").trim();
    if (!clean) { setState("idle"); return; }

    const utter = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();

    // Pick the best natural-sounding voice available — prefer Google US English
    const preferredVoice =
      voices.find(v => /google.*us.*english/i.test(v.name)) ||
      voices.find(v => /google.*english/i.test(v.name)) ||
      voices.find(v => /samantha|alex|daniel|karen|moira|tessa|fiona|serena|aaron|nicky/i.test(v.name)) ||
      voices.find(v => v.lang === "en-US" && /natural|enhanced|premium/i.test(v.name)) ||
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[selectedVoice];

    if (preferredVoice) utter.voice = preferredVoice;
    utter.rate = 1; utter.pitch = 1; utter.volume = 1;

    utter.onend = () => {
      if (isMounted.current) {
        setState("listening");
        setTranscript("");
        try { recognitionRef.current?.start(); } catch {}
      }
    };
    utter.onerror = () => {
      if (isMounted.current) setState("idle");
    };

    setState("speaking");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [selectedVoice]);  // selectedVoice kept as fallback only

  // Interrupt speaking
  const handleInterrupt = useCallback(() => {
    if (state === "speaking") {
      window.speechSynthesis?.cancel();
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
        <button onClick={handleClose}
          className="p-2.5 rounded-xl glass-strong hover:bg-white/10 transition-colors touch-target no-select"
          style={{ color: "var(--fg)" }} aria-label="End conversation">
          <Phone className="w-5 h-5 text-red-400 rotate-[135deg]" />
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
            {muted ? <MicOff className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* === CENTER: TRANSCRIPT + VISUALIZER === */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-2xl">
        {/* Transcript */}
        <div className="text-center mb-8 space-y-3 w-full">
          {lastUserText && (
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              You: <span style={{ color: "var(--fg)" }}>{lastUserText}</span>
            </p>
          )}
          {lastAIText && (
            <p className="text-base" style={{ color: "var(--fg)" }}>
              {lastAIText.slice(0, 200)}{lastAIText.length > 200 ? "..." : ""}
            </p>
          )}
          {state === "listening" && transcript && (
            <p className="text-base text-primary">{transcript}</p>
          )}
        </div>

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
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
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

        {/* State text */}
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
