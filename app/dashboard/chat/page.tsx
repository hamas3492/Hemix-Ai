"use client";

import { useState, useRef, useCallback, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Square, Paperclip, X,
  Mic, MicOff, Wand2, Plus, ArrowUp, AudioLines,
} from "lucide-react";
import { nanoid } from "nanoid";
import type { Message } from "@/types";
import { useChatStore, getSystemPrompt } from "@/lib/store";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { showSuccess } from "@/components/ui/Toast";
import { useAutoScroll, useVoiceInput } from "@/hooks";
import { copyToClipboard } from "@/lib/utils";

// Lazy load heavy components
import dynamic from "next/dynamic";
const ImageViewer = dynamic(() => import("@/components/ui/ImageViewer").then(m => m.ImageViewer), { ssr: false });
const VoiceConversation = dynamic(() => import("@/components/ui/VoiceConversation").then(m => m.VoiceConversation), { ssr: false });

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner size={32} /></div>}>
      <ChatPage />
    </Suspense>
  );
}

// === IMAGE REQUEST DETECTION ===
function isImageRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const p1 = /(\bgenerate\b|\bcreate\b|\bmake\b|\bdraw\b|\bdesign\b).*(\bimage\b|\bpicture\b|\bphoto\b|\bart\b|\billustration\b|\bdrawing\b)/.test(lower);
  const p2 = /(\bimage\b|\bpicture\b|\bphoto\b|\bart\b).*(\bgenerate\b|\bcreate\b|\bmake\b|\bdraw\b)/.test(lower);
  const p3 = /^draw\b/.test(lower);
  const p4 = /\b(generate|create|make)\s+(me\s+)?(a|an)\s+(photo|image|picture|drawing|illustration|painting)\b/.test(lower);
  return p1 || p2 || p3 || p4;
}

// === IMAGE EDIT DETECTION ===
function isImageEditRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  const editPatterns = [
    /\bmake it\b/, /\bmake it darker\b/, /\bmake it lighter\b/, /\bmake it cinematic\b/,
    /\bremove (the )?background\b/, /\bchange (the )?(shirt|color|sky|background)\b/,
    /\badd (rain|snow|sun|clouds|fire|light)\b/, /\bchange (it )?to \d+:\d+\b/,
    /\bmake it (bigger|smaller|wider|taller)\b/, /\bturn (it|him|her) into\b/,
    /\badd (a |an )\w+ to (it|the image|the picture)\b/, /\bmodify\b/, /\bedit (the )?(image|picture)\b/,
    /\bmake (it|this) (more|less)\b/, /\bchange the style\b/, /\bmake it (realistic|cartoon|anime)\b/,
  ];
  return editPatterns.some(p => p.test(lower));
}

function extractImagePrompt(text: string): string {
  return text
    .replace(/^(generate|create|make|draw|design)\s+(me\s+)?(a|an|the)?\s*(image|picture|photo|art|illustration|drawing|painting)?\s*(of|showing|depicting|with|that|which|featuring)?\s*/i, "")
    .replace(/^(please\s+)?(can you\s+)?/i, "")
    .trim() || text.trim();
}

async function readFileContent(file: File): Promise<string | null> {
  const textTypes = ["text/", "application/json", "application/xml", "application/javascript", "application/typescript"];
  const textExtensions = [".txt", ".md", ".json", ".xml", ".js", ".ts", ".tsx", ".jsx", ".py", ".java", ".c", ".cpp", ".html", ".css", ".scss", ".yml", ".yaml", ".sh", ".sql", ".csv", ".env", ".gitignore"];
  const isText = textTypes.some((t) => file.type.startsWith(t)) || textExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  if (isText && file.size < 100000) return await file.text();
  return null;
}

function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("c");

  const {
    conversations, activeConversationId, createConversation,
    addMessage, updateMessage, deleteMessage,
    isGenerating, setGenerating, chatSettings,
    voiceModeOpen: voiceMode, setVoiceModeOpen: setVoiceMode,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [selectedVoice] = useState(0);
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const [editingImagePrompt, setEditingImagePrompt] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const imageAbortRef = useRef<AbortController | null>(null);
  const { listening, supported: voiceSupported, start: startListening, stop: stopListening } = useVoiceInput();
  const messagesEndRef = useAutoScroll<HTMLDivElement>([conversations]);

  const activeConv = conversations.find((c) => c.id === (conversationId || activeConversationId));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  // === SHARE MESSAGE ===
  const handleShare = useCallback(async (msg: Message) => {
    const shareText = `Hemix AI said:\n\n${msg.content}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Hemix AI", text: shareText });
      } catch {}
    } else {
      copyToClipboard(shareText);
      showSuccess("Copied to clipboard");
    }
  }, []);

  // === TTS SPEAK ===
  const handleSpeak = useCallback((text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    const clean = text.replace(/```[\s\S]*?```/g, " code block ").replace(/[*#`_>|]/g, "").trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > selectedVoice) u.voice = voices[selectedVoice];
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeakingId(msgId);
  }, [speakingId, selectedVoice]);

  // === IMAGE GENERATION ===
  const handleImageGenerate = useCallback(async (prompt: string, convId: string, isEdit = false, editContext?: string) => {
    setGeneratingImage(true);
    let cleanPrompt = extractImagePrompt(prompt);
    if (isEdit && editContext) {
      cleanPrompt = `${editContext}, ${cleanPrompt}`;
    }

    const imgMessage: Message = {
      id: nanoid(), role: "assistant", content: "",
      createdAt: new Date().toISOString(),
      status: "streaming", type: "image", imagePrompt: cleanPrompt,
    };
    addMessage(convId, imgMessage);

    imageAbortRef.current = new AbortController();
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt }),
        signal: imageAbortRef.current.signal,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error("[chat] Image generation API error:", res.status, errBody);
        throw new Error(errBody.error || "Image generation failed");
      }
      const data = await res.json();
      if (!data.url) {
        console.error("[chat] Image generation: no URL in response", data);
        throw new Error("No image URL returned");
      }
      updateMessage(convId, imgMessage.id, { imageUrl: data.url, content: "", status: "complete" });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        updateMessage(convId, imgMessage.id, {
          content: "Image generation cancelled.", status: "error", type: "image",
        });
      } else {
        console.error("[chat] Image generation error:", err);
        updateMessage(convId, imgMessage.id, {
          content: "Image generation failed. Please try again.", status: "error", type: "image",
        });
      }
    } finally {
      setGeneratingImage(false);
      imageAbortRef.current = null;
    }
  }, [addMessage, updateMessage]);

  // === IMAGE RETRY ===
  const handleImageRetry = useCallback((convId: string, msgId: string, prompt: string) => {
    updateMessage(convId, msgId, { status: "streaming", imageUrl: undefined, content: "" });
    handleImageGenerate(prompt, convId);
  }, [updateMessage, handleImageGenerate]);

  // === IMAGE VARIATION ===
  const handleImageVariation = useCallback((prompt: string, convId: string) => {
    handleImageGenerate(prompt, convId, false);
  }, [handleImageGenerate]);

  // === IMAGE EDIT CLICK — focus input with edit context ===
  const handleImageEditClick = useCallback((imagePrompt: string) => {
    setEditingImagePrompt(imagePrompt);
    setInput("");
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder*="Ask anything"]') as HTMLTextAreaElement;
      textarea?.focus();
    }, 50);
  }, []);

  // === DRAG & DROP FILE HANDLERS ===
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) setAttachments((prev) => [...prev, ...files]);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating || generatingImage) return;

    let convId = activeConversationId;
    if (!activeConv) convId = createConversation("hemix-1");

    let fileContents: string[] = [];
    for (const file of attachments) {
      const content = await readFileContent(file);
      if (content) fileContents.push(`[File: ${file.name}]\n${content}`);
    }

    const userMessage: Message = {
      id: nanoid(), role: "user", content: input.trim(),
      createdAt: new Date().toISOString(),
      attachments: attachments.map((f) => ({ id: nanoid(), name: f.name, type: f.type, size: f.size })),
    };
    addMessage(convId!, userMessage);
    const currentInput = input.trim();
    setInput(""); setAttachments([]);

    // === EXPLICIT IMAGE EDIT (from Edit button) ===
    if (editingImagePrompt) {
      await handleImageGenerate(currentInput, convId!, true, editingImagePrompt);
      setEditingImagePrompt(null);
      return;
    }

    // === AUTO-DETECT IMAGE REQUEST ===
    if (isImageRequest(currentInput)) {
      await handleImageGenerate(currentInput, convId!);
      return;
    }

    // === AUTO-DETECT IMAGE EDIT ===
    const lastImageMsg = [...(activeConv?.messages || [])].reverse().find(m => m.type === "image" && m.imageUrl);
    if (lastImageMsg && isImageEditRequest(currentInput)) {
      await handleImageGenerate(currentInput, convId!, true, lastImageMsg.imagePrompt);
      return;
    }

    // === NORMAL CHAT ===
    const assistantMessage: Message = {
      id: nanoid(), role: "assistant", content: "",
      createdAt: new Date().toISOString(), status: "streaming",
    };
    addMessage(convId!, assistantMessage);
    setGenerating(true);
    abortRef.current = new AbortController();

    const sysPrompt = getSystemPrompt(chatSettings, activeConv?.personality);
    const userContent = fileContents.length > 0 ? `${currentInput}\n\n${fileContents.join("\n\n")}` : currentInput;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: activeConv?.model || "hemix-1",
          messages: [
            { role: "system", content: sysPrompt },
            ...(activeConv?.messages || []).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userContent },
          ],
          temperature: chatSettings.temperature ?? 0.7,
          maxTokens: chatSettings.maxTokens ?? 16384,
          topP: chatSettings.topP ?? 1,
        }),
      });

      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "", accumulated = "";

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
            if (delta) {
              accumulated += delta;
              updateMessage(convId!, assistantMessage.id, { content: accumulated, status: "streaming" });
            }
          } catch { continue; }
        }
      }
      updateMessage(convId!, assistantMessage.id, {
        content: accumulated || "I couldn't generate a response. Please try again.",
        status: "complete",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        updateMessage(convId!, assistantMessage.id, { status: "complete" });
      } else {
        updateMessage(convId!, assistantMessage.id, {
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          status: "error",
        });
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [input, attachments, isGenerating, generatingImage, activeConv, activeConversationId, createConversation, addMessage, updateMessage, setGenerating, chatSettings, handleImageGenerate, editingImagePrompt]);

  const handleStop = () => {
    abortRef.current?.abort();
    imageAbortRef.current?.abort();
    setGenerating(false);
    setGeneratingImage(false);
  };

  const handleRegenerate = useCallback(async () => {
    if (!activeConv || activeConv.messages.length < 2) return;
    const lastUserMsg = [...activeConv.messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    deleteMessage(activeConv.id, activeConv.messages[activeConv.messages.length - 1].id);
    setInput(lastUserMsg.content);
    setTimeout(() => handleSend(), 100);
  }, [activeConv, deleteMessage, handleSend]);

  // === VOICE CONVERSATION CALLBACKS ===
  const handleVoiceUserMessage = useCallback((text: string) => {
    // This is called from voice mode — we add the message to chat
    let convId = activeConversationId;
    if (!activeConv) convId = createConversation("hemix-1");
    const userMsg: Message = {
      id: nanoid(), role: "user", content: text,
      createdAt: new Date().toISOString(), voiceTranscript: true,
    };
    addMessage(convId!, userMsg);
  }, [activeConv, activeConversationId, createConversation, addMessage]);

  const handleVoiceAIResponse = useCallback((text: string) => {
    let convId = activeConversationId;
    if (!activeConv) convId = createConversation("hemix-1");
    const aiMsg: Message = {
      id: nanoid(), role: "assistant", content: text,
      createdAt: new Date().toISOString(), status: "complete", voiceTranscript: true,
    };
    addMessage(convId!, aiMsg);
  }, [activeConv, activeConversationId, createConversation, addMessage]);

  if (!activeConv) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="text-center max-w-md w-full px-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6 border border-primary/30 shadow-xl shadow-primary/20">
              <img src="/assets/icon.png" alt="Hemix AI" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Hemix AI</h2>
            <p className="text-muted mb-6 text-sm sm:text-base">Chat, generate images, or talk — all in one place.</p>
            <Button variant="primary" size="lg"
              onClick={() => createConversation("hemix-1")}
              className="bg-gradient-to-r from-primary to-secondary font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]">
              <img src="/assets/icon.png" alt="Hemix AI" className="w-4 h-4 rounded-full object-cover" />
              Start New Chat
            </Button>
            <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-3 text-left">
              {[
                { title: "Write code", desc: "Build a REST API with Express" },
                { title: "Generate image", desc: "Generate an image of a sunset" },
                { title: "Voice chat", desc: "Talk to Hemix with your voice" },
                { title: "Ask anything", desc: "What is quantum computing?" },
              ].map((s, i) => (
                <button key={i}
                  onClick={() => { createConversation("hemix-1"); setTimeout(() => setInput(s.desc), 200); }}
                  className="glass-card p-3 sm:p-4 text-left hover:scale-[1.02] transition-transform touch-target">
                  <p className="text-sm font-medium text-white mb-0.5">{s.title}</p>
                  <p className="text-xs text-muted">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Voice conversation messages (simplified for the voice component)
  const voiceMessages = activeConv.messages.map(m => ({ role: m.role, content: m.content }));

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* === HEADER — minimal, ChatGPT-style === */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md overflow-hidden shrink-0">
            <img src="/assets/icon.png" alt="Hemix AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{activeConv.title}</h1>
        </div>
      </div>

      {/* === MESSAGES === */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 min-h-0 chat-scroll relative"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ backgroundImage: "radial-gradient(rgba(139,92,246,0.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center"
            onDragLeave={handleDragLeave}
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
            <div className="rounded-2xl border-2 border-dashed p-8 text-center"
              style={{ borderColor: "var(--primary, #3b82f6)", background: "var(--card-bg)" }}>
              <Paperclip className="w-10 h-10 mx-auto mb-3 text-primary" />
              <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Drop files to attach</p>
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-5">
          {activeConv.messages.map((msg, i) => (
            <ChatBubble
              key={msg.id} message={msg} isLast={i === activeConv.messages.length - 1}
              onRegenerate={handleRegenerate}
              onEdit={(newContent) => updateMessage(activeConv.id, msg.id, { content: newContent, edited: true })}
              onLike={() => updateMessage(activeConv.id, msg.id, { liked: !msg.liked, disliked: false })}
              onDislike={() => updateMessage(activeConv.id, msg.id, { disliked: !msg.disliked, liked: false })}
              onShare={() => handleShare(msg)}
              onImageClick={(url) => setImageViewer(url)}
              onImageRetry={() => handleImageRetry(activeConv.id, msg.id, msg.imagePrompt || "")}
              onImageVariation={() => handleImageVariation(msg.imagePrompt || "", activeConv.id)}
              onImageEdit={() => handleImageEditClick(msg.imagePrompt || "")}
              selectedVoice={selectedVoice}
              onSpeak={(text) => handleSpeak(text, msg.id)}
              isSpeaking={speakingId === msg.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* === COMPOSER — ChatGPT-style unified bar === */}
      <div className="border-t px-3 sm:px-4 py-3 sm:py-4 backdrop-blur-xl shrink-0 chat-composer safe-bottom"
        style={{ borderColor: 'var(--glass-border)', background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto">
          {/* Editing image indicator */}
          {editingImagePrompt && (
            <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-lg border"
              style={{ background: "var(--input-bg)", borderColor: "var(--primary, #3b82f6)" }}>
              <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--fg)" }}>
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                Editing image: <span className="truncate max-w-[200px]" style={{ color: "var(--fg-muted)" }}>{editingImagePrompt}</span>
              </span>
              <button onClick={() => setEditingImagePrompt(null)} className="text-xs touch-target" style={{ color: "var(--fg-muted)" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                  <Paperclip className="w-3 h-3" style={{ color: "var(--fg-muted)" }} />
                  <span className="text-xs truncate max-w-[120px] sm:max-w-[150px]" style={{ color: "var(--fg)" }}>{file.name}</span>
                  <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="touch-target" style={{ color: "var(--fg-muted)" }}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Unified input container */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative min-w-0">
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={editingImagePrompt ? "Describe your edit..." : "Message Hemix AI"}
                rows={1}
                className="w-full pl-11 pr-12 sm:pr-14 py-3 sm:py-3.5 rounded-3xl border text-sm resize-none focus:outline-none transition-colors min-h-[52px] sm:min-h-[56px] max-h-[200px]"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--fg)', height: "auto" }}
                onInput={(e) => { e.currentTarget.style.height = "auto"; e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"; }} />

              {/* Left: + attach button */}
              <div className="absolute left-2.5 sm:left-3 bottom-2.5 sm:bottom-3 flex items-center gap-1">
                <label className="cursor-pointer touch-target no-select p-1 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center" aria-label="Attach files"
                  style={{ color: "var(--fg-muted)" }}>
                  <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                  <Plus className="w-5 h-5" />
                </label>
              </div>

              {/* Right: mic + voice-assistant + send */}
              <div className="absolute right-2 sm:right-2.5 bottom-2 sm:bottom-2.5 flex items-center gap-1">
                {voiceSupported && (
                  <button onClick={() => { if (listening) stopListening(); else startListening((text) => setInput(text)); }}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors touch-target no-select"
                    style={{ color: listening ? "#3b82f6" : "var(--fg-muted)" }}
                    title={listening ? "Stop recording" : "Voice typing"}
                    aria-label={listening ? "Stop recording" : "Voice typing"}>
                    {listening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                  </button>
                )}
                {/* Voice assistant — opens full voice conversation */}
                <button onClick={() => setVoiceMode(true)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors touch-target no-select"
                  style={{ color: "var(--fg-muted)" }}
                  title="Voice assistant"
                  aria-label="Open voice assistant">
                  <AudioLines className="w-4 h-4" />
                </button>
                {/* Send / Stop button — black rounded square inside the input */}
                {isGenerating || generatingImage ? (
                  <button onClick={handleStop}
                    className="p-2 rounded-xl shrink-0 touch-target flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: "var(--fg)", color: "var(--bg)" }}
                    aria-label="Stop generation">
                    {generatingImage ? <Spinner size={16} /> : <Square className="w-4 h-4" />}
                  </button>
                ) : (
                  <button onClick={handleSend} disabled={!input.trim()}
                    className="p-2 rounded-xl shrink-0 touch-target flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-30"
                    style={{ background: "var(--fg)", color: "var(--bg)" }}
                    aria-label="Send message">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-[10px] sm:text-xs text-center mt-2" style={{ color: "var(--fg-muted)" }}>
            Hemix AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>

      {/* === IMAGE VIEWER MODAL === */}
      {imageViewer && (
        <ImageViewer src={imageViewer} alt="Generated image" onClose={() => setImageViewer(null)} />
      )}

      {/* === VOICE CONVERSATION SCREEN === */}
      {voiceMode && (
        <VoiceConversation
          onClose={() => setVoiceMode(false)}
          selectedVoice={selectedVoice}
          messages={voiceMessages}
          onUserMessage={handleVoiceUserMessage}
          onAIResponse={handleVoiceAIResponse}
          systemPrompt={getSystemPrompt(chatSettings, activeConv.personality)}
        />
      )}
    </div>
  );
}
