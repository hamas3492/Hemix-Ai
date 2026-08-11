"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Voice Input (Speech-to-Text)
export function useVoiceInput() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setSupported(true);
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        let final = "";
        for (let i = 0; i < e.results.length; i++) {
          final += e.results[i][0].transcript;
        }
        if (onResultRef.current) onResultRef.current(final);
      };

      rec.onerror = () => { setListening(false); };
      rec.onend = () => { setListening(false); };
      recognitionRef.current = rec;
    }
    return () => { try { recognitionRef.current?.abort(); } catch {} };
  }, []);

  const start = useCallback((onResult: (text: string) => void) => {
    if (!recognitionRef.current) return;
    onResultRef.current = onResult;
    try { recognitionRef.current.start(); setListening(true); } catch {}
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}

// Text-to-Speech
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => { try { window.speechSynthesis?.cancel(); } catch {} };
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    const clean = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[*#`_>]/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1; utter.pitch = 1; utter.volume = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }, [speaking]);

  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setSpeaking(false); }, []);
  return { speaking, supported, speak, stop };
}
