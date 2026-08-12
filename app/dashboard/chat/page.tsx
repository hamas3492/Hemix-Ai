"use client";

import { useState, useRef, useCallback, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Square, Paperclip, Download, Search, X,
  Mic, MicOff, Volume2, ChevronDown, Sparkles, User as UserIcon,
  Bot, Cpu, Wand2,
} from "lucide-react";
import { nanoid } from "nanoid";
import type { Message, PersonalityId } from "@/types";
import { PERSONALITIES } from "@/types";
import { useChatStore, getSystemPrompt } from "@/lib/store";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { showSuccess } from "@/components/ui/Toast";
import { useAutoScroll, useVoiceInput } from "@/hooks";
import { downloadFile, copyToClipboard } from "@/lib/utils";
import { AI_MODELS } from "@/lib/models";

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
    isGenerating, setGenerating, chatSettings, exportConversation,
    updateConversationModel, updateConversationPersonality,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showPersonality, setShowPersonality] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const [editingImagePrompt, setEditingImagePrompt] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { listening, supported: voiceSupported, start: startListening, stop: stopListening } = useVoiceInput();
  const messagesEndRef = useAutoScroll<HTMLDivElement>([conversations]);

  const activeConv = conversations.find((c) => c.id === (conversationId || activeConversationId));

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) setAvailableVoices(v);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

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

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanPrompt }),
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
      console.error("[chat] Image generation error:", err);
      updateMessage(convId, imgMessage.id, {
        content: "Image generation failed. Please try again.", status: "error", type: "image",
      });
    } finally {
      setGeneratingImage(false);
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

  const handleStop = () => { abortRef.current?.abort(); setGenerating(false); };

  const handleRegenerate = useCallback(async () => {
    if (!activeConv || activeConv.messages.length < 2) return;
    const lastUserMsg = [...activeConv.messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;
    deleteMessage(activeConv.id, activeConv.messages[activeConv.messages.length - 1].id);
    setInput(lastUserMsg.content);
    setTimeout(() => handleSend(), 100);
  }, [activeConv, deleteMessage, handleSend]);

  const handleExport = () => {
    if (!activeConv) return;
    const content = exportConversation(activeConv.id);
    downloadFile(content, `${activeConv.title.replace(/\s+/g, "-").toLowerCase()}.md`, "text/markdown");
    showSuccess("Conversation exported");
  };

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

  const filteredMessages = showSearch && searchTerm
    ? activeConv.messages.filter((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : activeConv.messages;

  const currentModel = AI_MODELS.find(m => m.id === activeConv.model) || AI_MODELS[0];
  const currentPersonality = activeConv.personality ? PERSONALITIES[activeConv.personality] : null;

  // Voice conversation messages (simplified for the voice component)
  const voiceMessages = activeConv.messages.map(m => ({ role: m.role, content: m.content }));

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* === HEADER === */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          {/* Model selector */}
          <div className="relative">
            <button onClick={() => setShowModelSelector(!showModelSelector)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors touch-target"
              style={{ color: "var(--fg)" }}>
              {currentModel.id === "hemix-1" ? <Bot className="w-4 h-4 text-primary" /> :
               currentModel.id === "auto" ? <Sparkles className="w-4 h-4 text-primary" /> :
               <Cpu className="w-4 h-4 text-primary" />}
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentModel.name}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
            </button>
            <AnimatePresence>
              {showModelSelector && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border shadow-2xl py-1"
                  style={{ background: "var(--card-bg)", borderColor: "var(--input-border)" }}>
                  {AI_MODELS.map((model) => (
                    <button key={model.id}
                      onClick={() => { updateConversationModel(activeConv.id, model.id); setShowModelSelector(false); }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors flex items-center gap-2.5 ${model.id === activeConv.model ? "text-primary" : ""}`}
                      style={model.id === activeConv.model ? {} : { color: "var(--fg)" }}>
                      {model.id === "hemix-1" ? <Bot className="w-4 h-4 shrink-0" /> :
                       model.id === "auto" ? <Sparkles className="w-4 h-4 shrink-0" /> :
                       <Cpu className="w-4 h-4 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{model.name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{model.description}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Personality selector */}
          <div className="relative">
            <button onClick={() => setShowPersonality(!showPersonality)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm hover:bg-white/5 transition-colors touch-target"
              style={{ color: "var(--fg-muted)" }}>
              <UserIcon className="w-4 h-4" />
              <span className="hidden sm:inline truncate max-w-[80px]">{currentPersonality ? currentPersonality.name : "Default"}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            </button>
            <AnimatePresence>
              {showPersonality && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border shadow-2xl py-1"
                  style={{ background: "var(--card-bg)", borderColor: "var(--input-border)" }}>
                  <p className="px-3 py-2 text-xs border-b" style={{ color: "var(--fg-muted)", borderColor: "var(--input-border)" }}>
                    AI Personality
                  </p>
                  <button onClick={() => { updateConversationPersonality(activeConv.id, "friendly" as PersonalityId); setShowPersonality(false); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors" style={{ color: "var(--fg)" }}>
                    <p className="text-sm font-medium">Default</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Balanced and helpful</p>
                  </button>
                  {(Object.keys(PERSONALITIES) as PersonalityId[]).map((id) => (
                    <button key={id}
                      onClick={() => { updateConversationPersonality(activeConv.id, id); setShowPersonality(false); }}
                      className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors ${activeConv.personality === id ? "text-primary" : ""}`}
                      style={activeConv.personality === id ? {} : { color: "var(--fg)" }}>
                      <p className="text-sm font-medium">{PERSONALITIES[id].name}</p>
                      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{PERSONALITIES[id].description}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Voice mode button */}
          <Button variant="ghost" size="icon" onClick={() => setVoiceMode(true)} title="Voice conversation"
            className="touch-target" aria-label="Open voice conversation">
            <Mic className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          </Button>
          {/* Voice selector */}
          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setShowVoicePicker(!showVoicePicker)} title="Select voice"
              className="hidden sm:flex touch-target" aria-label="Select TTS voice">
              <Volume2 className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
            </Button>
            <AnimatePresence>
              {showVoicePicker && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-2 z-50 w-64 max-h-64 overflow-y-auto rounded-xl border shadow-2xl"
                  style={{ background: "var(--input-bg)", borderColor: "var(--input-border)" }}>
                  <p className="px-3 py-2 text-xs border-b" style={{ color: "var(--fg-muted)", borderColor: "var(--input-border)" }}>
                    Select Voice ({availableVoices.length} available)
                  </p>
                  {availableVoices.slice(0, 20).map((voice, i) => (
                    <button key={i}
                      onClick={() => { setSelectedVoice(i); setShowVoicePicker(false);
                        const u = new SpeechSynthesisUtterance("Hello, I am Hemix AI.");
                        u.voice = voice; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${selectedVoice === i ? "text-primary font-medium" : ""}`}
                      style={selectedVoice === i ? {} : { color: "var(--fg)" }}>
                      {voice.name} <span style={{ color: "var(--fg-muted)" }}>({voice.lang})</span>
                    </button>
                  ))}
                  {availableVoices.length === 0 && <p className="px-3 py-4 text-xs" style={{ color: "var(--fg-muted)" }}>No voices available</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)} title="Search"
            className="hidden sm:flex touch-target" aria-label="Search messages">
            <Search className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export"
            className="hidden sm:flex touch-target" aria-label="Export conversation">
            <Download className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          </Button>
        </div>
      </div>

      {/* === SEARCH BAR === */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-3 sm:px-4 border-b border-white/5">
            <div className="relative py-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input type="text" placeholder="Search in conversation..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-primary/50"
                style={{ color: "var(--fg)" }} autoFocus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MESSAGES === */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 min-h-0 chat-scroll"
        style={{ backgroundImage: "radial-gradient(rgba(139,92,246,0.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-5">
          {filteredMessages.map((msg, i) => (
            <ChatBubble
              key={msg.id} message={msg} isLast={i === activeConv.messages.length - 1}
              onRegenerate={handleRegenerate}
              onDelete={() => deleteMessage(activeConv.id, msg.id)}
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

      {/* === COMPOSER === */}
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

          {/* Textarea & buttons */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative min-w-0">
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={editingImagePrompt ? "Describe your edit (e.g. make it darker, add rain)..." : "Ask anything... (say 'generate an image of...' to create images)"}
                rows={1}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-20 sm:pr-24 rounded-2xl border text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors min-h-[48px] sm:min-h-[52px] max-h-[200px]"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--fg)', height: "auto" }}
                onInput={(e) => { e.currentTarget.style.height = "auto"; e.currentTarget.style.height = e.currentTarget.scrollHeight + "px"; }} />
              <div className="absolute right-2 sm:right-3 bottom-2.5 sm:bottom-3 flex items-center gap-2">
                {voiceSupported && (
                  <button onClick={() => { if (listening) stopListening(); else startListening((text) => setInput(text)); }}
                    className="transition-colors touch-target no-select" style={{ color: listening ? "#3b82f6" : "var(--fg-muted)" }}
                    title={listening ? "Stop recording" : "Voice input"} aria-label={listening ? "Stop recording" : "Voice input"}>
                    {listening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4 hover:text-white" />}
                  </button>
                )}
                <label className="cursor-pointer touch-target no-select" aria-label="Attach files">
                  <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                  <Paperclip className="w-4 h-4 hover:text-white transition-colors" style={{ color: "var(--fg-muted)" }} />
                </label>
              </div>
            </div>

            {isGenerating || generatingImage ? (
              <Button variant="destructive" size="icon" onClick={handleStop} className="rounded-2xl shrink-0 touch-target" aria-label="Stop generation">
                {generatingImage ? <Spinner size={16} /> : <Square className="w-4 h-4" />}
              </Button>
            ) : (
              <Button variant="primary" size="icon" onClick={handleSend} disabled={!input.trim()}
                className="rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md shadow-primary/20 shrink-0 touch-target"
                aria-label="Send message">
                <Send className="w-4 h-4" />
              </Button>
            )}
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
          onVoiceChange={setSelectedVoice}
          messages={voiceMessages}
          onUserMessage={handleVoiceUserMessage}
          onAIResponse={handleVoiceAIResponse}
          systemPrompt={getSystemPrompt(chatSettings, activeConv.personality)}
        />
      )}
    </div>
  );
}
