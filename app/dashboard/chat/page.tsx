"use client";

import { useState, useRef, useCallback, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Square,
  Paperclip,
  Download,
  Search,
  Sparkles,
  X,
  Mic,
  MicOff,
  ImageIcon,
  MessageSquare,
  Volume2,
  ChevronDown,
} from "lucide-react";
import { nanoid } from "nanoid";
import type { Message } from "@/types";
import { useChatStore } from "@/lib/store";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useAutoScroll, useVoiceInput } from "@/hooks";
import { downloadFile } from "@/lib/utils";

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner size={32} /></div>}>
      <ChatPage />
    </Suspense>
  );
}

// Read file contents for text files
async function readFileContent(file: File): Promise<string | null> {
  const textTypes = ["text/", "application/json", "application/xml", "application/javascript", "application/typescript"];
  const textExtensions = [".txt", ".md", ".json", ".xml", ".js", ".ts", ".tsx", ".jsx", ".py", ".java", ".c", ".cpp", ".html", ".css", ".scss", ".yml", ".yaml", ".sh", ".sql", ".csv", ".env", ".gitignore"];

  const isText = textTypes.some((t) => file.type.startsWith(t)) || textExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (isText && file.size < 100000) {
    return await file.text();
  }
  return null;
}

function ChatPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("c");

  const {
    conversations,
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
    deleteMessage,
    isGenerating,
    setGenerating,
    chatSettings,
    exportConversation,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageMode, setImageMode] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(0);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const { listening, supported: voiceSupported, start: startListening, stop: stopListening } = useVoiceInput();
  const messagesEndRef = useAutoScroll<HTMLDivElement>([conversations]);

  const activeConv = conversations.find(
    (c) => c.id === (conversationId || activeConversationId)
  );

  // Load TTS voices
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

  const handleImageGenerate = useCallback(async (prompt: string) => {
    if (!prompt.trim() || generatingImage) return;

    let convId = activeConversationId;
    if (!activeConv) {
      convId = createConversation("hemix-1");
    }

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: `🎨 Generate image: ${prompt.trim()}`,
      createdAt: new Date().toISOString(),
      type: "text",
    };
    addMessage(convId!, userMessage);
    setInput("");
    setGeneratingImage(true);

    const imgMessage: Message = {
      id: nanoid(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      status: "streaming",
      type: "image",
      imagePrompt: prompt.trim(),
    };
    addMessage(convId!, imgMessage);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) throw new Error("Image generation failed");

      const data = await res.json();
      updateMessage(convId!, imgMessage.id, {
        imageUrl: data.url,
        content: "",
        status: "complete",
      });
    } catch {
      updateMessage(convId!, imgMessage.id, {
        content: "Sorry, I couldn't generate that image. Please try again.",
        status: "error",
        type: "text",
      });
    } finally {
      setGeneratingImage(false);
    }
  }, [generatingImage, activeConv, activeConversationId, createConversation, addMessage, updateMessage]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    if (imageMode) {
      handleImageGenerate(input);
      return;
    }

    let convId = activeConversationId;
    if (!activeConv) {
      convId = createConversation("hemix-1");
    }

    // Read file contents
    let fileContents: string[] = [];
    for (const file of attachments) {
      const content = await readFileContent(file);
      if (content) {
        fileContents.push(`[File: ${file.name}]\n${content}`);
      }
    }

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
      attachments: attachments.map((f) => ({
        id: nanoid(),
        name: f.name,
        type: f.type,
        size: f.size,
      })),
    };

    addMessage(convId!, userMessage);
    const currentInput = input.trim();
    setInput("");
    setAttachments([]);

    const assistantMessage: Message = {
      id: nanoid(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      status: "streaming",
    };

    addMessage(convId!, assistantMessage);
    setGenerating(true);
    abortRef.current = new AbortController();

    // Build message content — include file contents
    const userContent = fileContents.length > 0
      ? `${currentInput}\n\n${fileContents.join("\n\n")}`
      : currentInput;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: activeConv?.model || "hemix-1",
          messages: [
            { role: "system", content: chatSettings.systemPrompt || "You are Hemix AI, a helpful and intelligent assistant created by Hamas Ahmed. When asked who made you, who built you, or who created you, your answer is Hamas Ahmed. You are Hemix AI, your own assistant. Keep answers short by default — a few sentences or a brief list. Only give a long, detailed, or step-by-step answer when the user explicitly asks for more detail, a full explanation, or a guide." },
            ...(activeConv?.messages || []).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: userContent },
          ],
          temperature: chatSettings.temperature ?? 0.7,
          maxTokens: chatSettings.maxTokens ?? 16384,
          topP: chatSettings.topP ?? 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              updateMessage(convId!, assistantMessage.id, {
                content: accumulated,
                status: "streaming",
              });
            }
          } catch {
            continue;
          }
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
  }, [
    input,
    attachments,
    isGenerating,
    activeConv,
    activeConversationId,
    createConversation,
    addMessage,
    updateMessage,
    setGenerating,
    chatSettings,
    imageMode,
    handleImageGenerate,
  ]);

  const handleStop = () => {
    abortRef.current?.abort();
    setGenerating(false);
  };

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

  if (!activeConv) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="text-center max-w-md w-full px-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6 border border-primary/30 shadow-xl shadow-primary/20">
              <img src="/assets/icon.png" alt="Hemix AI" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Hemix AI</h2>
            <p className="text-muted mb-6 text-sm sm:text-base">
              Ask anything, upload files, generate images, and get instant streaming responses.
            </p>

            <Button
              variant="primary"
              size="lg"
              onClick={() => createConversation("hemix-1")}
              className="bg-gradient-to-r from-primary to-secondary font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
            >
              <img src="/assets/icon.png" alt="Hemix AI" className="w-4 h-4 rounded-full object-cover" />
              Start New Chat
            </Button>

            <div className="mt-8 sm:mt-12 grid grid-cols-2 gap-3 text-left">
              {[
                { title: "Write code", desc: "Build a REST API with Express" },
                { title: "Generate image", desc: "A futuristic city at sunset" },
                { title: "Get creative", desc: "Write a short story about space" },
                { title: "Voice chat", desc: "Tap the mic and speak" },
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    createConversation("hemix-1");
                    setTimeout(() => setInput(s.desc), 200);
                  }}
                  className="glass-card p-3 sm:p-4 text-left hover:scale-[1.02] transition-transform"
                >
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

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{activeConv.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Voice selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVoicePicker(!showVoicePicker)}
              title="Select voice"
              className="hidden sm:flex"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            <AnimatePresence>
              {showVoicePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-2 z-50 w-64 max-h-64 overflow-y-auto rounded-xl border shadow-2xl"
                  style={{ background: "var(--input-bg)", borderColor: "var(--input-border)" }}
                >
                  <p className="px-3 py-2 text-xs border-b" style={{ color: "var(--fg-muted)", borderColor: "var(--input-border)" }}>
                    Select Voice ({availableVoices.length} available)
                  </p>
                  {availableVoices.slice(0, 20).map((voice, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedVoice(i);
                        setShowVoicePicker(false);
                        // Test the voice
                        const u = new SpeechSynthesisUtterance("Hello, I am Hemix AI.");
                        u.voice = voice;
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(u);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${selectedVoice === i ? "text-primary font-medium" : ""}`}
                      style={selectedVoice === i ? {} : { color: "var(--fg)" }}
                    >
                      {voice.name} <span style={{ color: "var(--fg-muted)" }}>({voice.lang})</span>
                    </button>
                  ))}
                  {availableVoices.length === 0 && (
                    <p className="px-3 py-4 text-xs" style={{ color: "var(--fg-muted)" }}>No voices available</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)} title="Search" className="hidden sm:flex">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export" className="hidden sm:flex">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-3 sm:px-4 border-b border-white/5"
          >
            <div className="relative py-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search in conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-primary/50"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 min-h-0 relative"
        style={{
          backgroundImage: "radial-gradient(rgba(139,92,246,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="max-w-3xl mx-auto space-y-3.5 sm:space-y-5">
          {filteredMessages.map((msg, i) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isLast={i === activeConv.messages.length - 1}
              onRegenerate={handleRegenerate}
              onDelete={() => deleteMessage(activeConv.id, msg.id)}
              onEdit={(newContent) => {
                updateMessage(activeConv.id, msg.id, { content: newContent, edited: true });
              }}
              selectedVoice={selectedVoice}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input section */}
      <div className="border-t px-3 sm:px-4 py-3 sm:py-4 backdrop-blur-xl shrink-0" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg)' }}>
        <div className="max-w-3xl mx-auto">
          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)' }}>
                  <Paperclip className="w-3 h-3 text-muted" />
                  <span className="text-xs truncate max-w-[120px] sm:max-w-[150px]" style={{ color: "var(--fg)" }}>{file.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mode toggle bar */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setImageMode(false)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${!imageMode ? "bg-primary/15 text-primary border border-primary/30" : "border border-transparent"}`}
              style={!imageMode ? {} : { color: "var(--fg-muted)" }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <button
              onClick={() => setImageMode(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${imageMode ? "bg-primary/15 text-primary border border-primary/30" : "border border-transparent"}`}
              style={imageMode ? {} : { color: "var(--fg-muted)" }}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Image</span>
            </button>
          </div>

          {/* Textarea & Send button */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative min-w-0">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={imageMode ? "Describe the image you want..." : "Ask anything..."}
                rows={1}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-16 sm:pr-20 rounded-2xl border text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors min-h-[48px] sm:min-h-[52px] max-h-[200px]" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--fg)', height: "auto" }}
                onInput={(e) => {
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                }}
              />
              <div className="absolute right-2 sm:right-3 bottom-2.5 sm:bottom-3 flex items-center gap-2">
                {voiceSupported && (
                  <button
                    onClick={() => {
                      if (listening) {
                        stopListening();
                      } else {
                        startListening((text) => setInput(text));
                      }
                    }}
                    className="transition-colors"
                    style={{ color: listening ? "#3b82f6" : "var(--fg-muted)" }}
                    title={listening ? "Stop recording" : "Voice input"}
                  >
                    {listening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4 hover:text-white" />}
                  </button>
                )}
                <label className="cursor-pointer">
                  <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                  <Paperclip className="w-4 h-4 hover:text-white transition-colors" style={{ color: "var(--fg-muted)" }} />
                </label>
              </div>
            </div>

            {isGenerating || generatingImage ? (
              <Button variant="destructive" size="icon" onClick={imageMode ? () => setGeneratingImage(false) : handleStop} className="rounded-2xl shrink-0">
                {generatingImage ? <Spinner size={16} /> : <Square className="w-4 h-4" />}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-md shadow-primary/20 shrink-0"
              >
                {imageMode ? <ImageIcon className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </Button>
            )}
          </div>

          <p className="text-[10px] sm:text-xs text-center mt-2" style={{ color: "var(--fg-muted)" }}>
            Hemix AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
