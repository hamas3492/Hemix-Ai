"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  const isProcessing = useRef(false);
  const isSpeaking = useRef(false); // Prevents double audio
  const messagesRef = useRef(messages);
  const systemPromptRef = useRef(systemPrompt);
  const mutedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAvailableRef = useRef<boolean | null>(null);

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { systemPromptRef.current = systemPrompt; }, [systemPrompt]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // --- Browser TTS fallback ---
  const browserSpeak = useCallback((text: string, onDone: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onDone();
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Detect Urdu/Arabic script
    const isUrdu = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);

    const preferredVoice = isUrdu
      ? voices.find(v => /google.*urdu/i.test(v.name)) ||
        voices.find(v => v.lang === "ur-PK") ||
        voices.find(v => v.lang === "ur") ||
        voices.find(v => /google.*hindi/i.test(v.name)) ||
        voices.find(v => v.lang === "hi-IN") ||
        voices.find(v => /multilingual/i.test(v.name)) ||
        voices.find(v => v.lang === "en-US") ||
        voices.find(v => v.lang.startsWith("en"))
      : voices.find(v => /google.*us.*english/i.test(v.name)) ||
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

    // Small delay to ensure cancel() finished
    setTimeout(() => {
      if (isMounted.current && isSpeaking.current) {
        window.speechSynthesis.speak(utter);
      } else {
        callDone();
      }
    }, 80);
  }, []);

  // --- Speak function (uses custom TTS API with browser fallback) ---
  const speakText = useCallback(async (text: string, onDone: () => void) => {
    if (typeof window === "undefined") { onDone(); return; }

    const clean = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[*#`_>|]/g, "").trim();
    if (!clean) { onDone(); return; }

    // GUARD: Prevent double audio — only one speak at a time
    if (isSpeaking.current) {
      // Cancel previous and start fresh
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    }
    isSpeaking.current = true;

    let doneCalled = false;
    const callDone = () => {
      if (!doneCalled) {
        doneCalled = true;
        isSpeaking.current = false;
        onDone();
      }
    };

    setState("speaking");

    // Check if custom TTS API is available (once per session)
    if (ttsAvailableRef.current === null) {
      try {
        const check = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkOnly: true }),
        });
        ttsAvailableRef.current = check.ok;
      } catch {
        ttsAvailableRef.current = false;
      }
    }

    if (!isSpeaking.current) { callDone(); return; } // Got interrupted during check

    // If custom TTS is available, use it
    if (ttsAvailableRef.current) {
      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!isSpeaking.current) { callDone(); return; } // Interrupted

        if (response.ok) {
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            callDone();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            browserSpeak(clean, callDone);
          };

          await audio.play().catch(() => {
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            browserSpeak(clean, callDone);
          });
          return;
        } else {
          ttsAvailableRef.current = false;
        }
      } catch {
        ttsAvailableRef.current = false;
      }
    }

    // Browser TTS fallback
    if (!isSpeaking.current) { callDone(); return; }
    browserSpeak(clean, callDone);
  }, [browserSpeak]);

  // --- Handle user speech → API → AI speaks ---
  const handleUserStop = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing.current) return;

    isProcessing.current = true;

    // Stop recognition immediately — no double recording
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
            { role: "system", content: systemPromptRef.current + "\n\nIMPORTANT: Detect the language the user speaks in. If the user speaks in Urdu or Roman Urdu, respond in Urdu (Urdu script). If the user speaks in English, respond in English. Always respond naturally in the same language the user used. Keep responses VERY short for voice mode — 1-3 sentences max. Be direct and concise." },
            ...messagesRef.current.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
          temperature: 0.5,
          maxTokens: 500, // Much shorter for fast voice responses
        }),
      });

      if (!response.ok) throw new Error("API error");

      // Read SSE stream directly — no JSON parsing attempt (fixes empty response bug)
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

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

      if (fullText && isMounted.current) {
        onAIResponse(fullText);

        if (!mutedRef.current) {
          speakText(fullText, () => {
            if (!isMounted.current) return;
            isProcessing.current = false;
            setState("listening");
            // Small delay before restarting recognition
            setTimeout(() => {
              if (isMounted.current && !isProcessing.current) {
                try { recognitionRef.current?.start(); } catch {}
              }
            }, 200);
          });
        } else {
          isProcessing.current = false;
          setState("listening");
          setTimeout(() => {
            if (isMounted.current && !isProcessing.current) {
              try { recognitionRef.current?.start(); } catch {}
            }
          }, 200);
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

  // Keep handleUserStop in a ref
  const handleUserStopRef = useRef(handleUserStop);
  useEffect(() => { handleUserStopRef.current = handleUserStop; }, [handleUserStop]);

  // Keep state in a ref for onend handler
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // --- Setup speech recognition (once) ---
  useEffect(() => {
    isMounted.current = true;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = false; // Non-continuous — prevents double recording
      rec.interimResults = true;
      rec.lang = "ur-PK"; // Urdu — picks up Urdu + English

      rec.onresult = (e: any) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }

        // Reset silence timer — 1s for faster response
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          if (text.trim().length > 0 && !isProcessing.current) {
            handleUserStopRef.current(text.trim());
          }
        }, 1000);
      };

      rec.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setState("error");
          isProcessing.current = false;
        }
      };

      rec.onend = () => {
        // Only restart if in listening state AND not processing AND still mounted
        // This prevents double recording
        if (isMounted.current && !isProcessing.current && stateRef.current === "listening") {
          try { rec.start(); } catch {}
        }
      };

      recognitionRef.current = rec;
    } else {
      setState("error");
    }

    return () => {
      isMounted.current = false;
      isSpeaking.current = false;
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      try { recognitionRef.current?.abort(); } catch {}
      try { window.speechSynthesis?.cancel(); } catch {}
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  // --- Controls ---
  const startListening = useCallback(() => {
    if (!recognitionRef.current) { setState("error"); return; }
    isProcessing.current = false;
    isSpeaking.current = false;
    setState("listening");
    try { recognitionRef.current?.start(); } catch {}
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    isProcessing.current = false;
    setState("idle");
  }, []);

  const handleInterrupt = useCallback(() => {
    if (state === "speaking") {
      // Stop all audio
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      isSpeaking.current = false;
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
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    isProcessing.current = false;
    isSpeaking.current = false;
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
      style={{ background: "rgba(0,0,0,0.92)" }}
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

      {/* === CENTER: VISUALIZER ONLY — no text/transcript === */}
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

        {/* State label only — no transcript */}
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
