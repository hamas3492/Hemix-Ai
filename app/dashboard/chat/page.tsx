"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Square,
  Paperclip,
  Trash2,
  Download,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import type { Message } from "@/types";
import { useChatStore } from "@/lib/store";
import { getModelById } from "@/lib/models";
import { ModelSelector } from "@/components/dashboard/ModelSelector";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useAutoScroll } from "@/hooks";
import { downloadFile } from "@/lib/utils";

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner size={32} /></div>}>
      <ChatPage />
    </Suspense>
  );
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
    updateConversationModel,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useAutoScroll<HTMLDivElement>([conversations]);

  const activeConv = conversations.find(
    (c) => c.id === (conversationId || activeConversationId)
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    let convId = activeConversationId;
    if (!activeConv) {
      convId = createConversation("gpt-4o-mini");
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
    setInput("");
    setAttachments([]);

    const model = getModelById(activeConv?.model || "gpt-4o-mini");
    if (!model) return;

    const assistantMessage: Message = {
      id: nanoid(),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      model: model.name,
      status: "streaming",
    };

    addMessage(convId!, assistantMessage);
    setGenerating(true);
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: model.id,
          messages: [
            { role: "system", content: chatSettings.systemPrompt },
            ...(activeConv?.messages || []).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: input.trim() },
          ],
          temperature: chatSettings.temperature,
          maxTokens: chatSettings.maxTokens,
          topP: chatSettings.topP,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader!.read();
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
        content: accumulated || "No response received.",
        status: "complete",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        updateMessage(convId!, assistantMessage.id, { status: "complete" });
      } else {
        updateMessage(convId!, assistantMessage.id, {
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
          status: "error",
        });
        showError("Failed to generate response");
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  }, [
    input,
    isGenerating,
    activeConv,
    activeConversationId,
    addMessage,
    updateMessage,
    createConversation,
    setGenerating,
    chatSettings,
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  if (!activeConv) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to Hemix AI</h2>
          <p className="text-muted mb-6">Start a conversation with any AI model. Ask anything, upload files, and get instant streaming responses.</p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => createConversation("gpt-4o-mini")}
          >
            <Sparkles className="w-4 h-4" />
            Start New Chat
          </Button>

          <div className="mt-12 grid grid-cols-2 gap-3 text-left">
            {[
              { title: "Write code", desc: "Build a REST API with Express" },
              { title: "Get creative", desc: "Write a short story about space" },
              { title: "Analyze data", desc: "Help me understand this CSV" },
              { title: "Learn something", desc: "Explain quantum computing" },
            ].map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  createConversation("gpt-4o-mini");
                  setTimeout(() => setInput(s.desc), 200);
                }}
                className="glass-card p-4 text-left hover:scale-[1.02] transition-transform"
              >
                <p className="text-sm font-medium text-white mb-0.5">{s.title}</p>
                <p className="text-xs text-muted">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filteredMessages = showSearch && searchTerm
    ? activeConv.messages.filter((m) => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
    : activeConv.messages;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <ModelSelector
            value={activeConv.model}
            onChange={(modelId) => {
              useChatStore.getState().renameConversation(activeConv.id, activeConv.title);
              // Update model by replacing conversation
              const conv = useChatStore.getState().conversations.find((c) => c.id === activeConv.id);
              if (conv) useChatStore.getState().updateMessage(activeConv.id, conv.messages[0]?.id || "", {});
            }}
          />
          <span className="text-sm text-muted hidden sm:block">{activeConv.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)} title="Search">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExport} title="Export">
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
            className="overflow-hidden px-4 border-b border-white/5"
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
      <div ref={messagesEndRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
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
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-4">
        <div className="max-w-3xl mx-auto">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Paperclip className="w-3 h-3 text-muted" />
                  <span className="text-xs text-white truncate max-w-[150px]">{file.name}</span>
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

          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything... (Shift+Enter for new line)"
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-muted/50 resize-none focus:outline-none focus:border-primary/50 transition-colors min-h-[52px] max-h-[200px]"
                style={{ height: "auto" }}
                onInput={(e) => {
                  e.currentTarget.style.height = "auto";
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
                }}
              />
              <label className="absolute right-3 bottom-3 cursor-pointer">
                <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                <Paperclip className="w-4 h-4 text-muted hover:text-white transition-colors" />
              </label>
            </div>

            {isGenerating ? (
              <Button variant="destructive" size="icon" onClick={handleStop} className="rounded-2xl">
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="rounded-2xl"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>

          <p className="text-xs text-muted/60 text-center mt-2">
            Hemix AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
