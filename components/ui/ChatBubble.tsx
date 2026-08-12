"use client";

import { motion } from "framer-motion";
import { Copy, Check, RotateCcw, Trash2, Pencil, Volume2, Pause, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Message } from "@/types";
import { copyToClipboard, downloadFile } from "@/lib/utils";
import { TypingIndicator } from "@/components/ui/Spinner";
import { useState, useRef, useEffect } from "react";

const LANG_EXTENSIONS: Record<string, string> = {
  javascript: "js", js: "js", jsx: "jsx", typescript: "ts", ts: "ts", tsx: "tsx",
  python: "py", py: "py", java: "java", kotlin: "kt", swift: "swift",
  c: "c", cpp: "cpp", "c++": "cpp", csharp: "cs", "c#": "cs", cs: "cs",
  go: "go", rust: "rs", php: "php", ruby: "rb", r: "r", sql: "sql",
  html: "html", css: "css", scss: "scss", json: "json", yaml: "yml", yml: "yml",
  xml: "xml", markdown: "md", md: "md", bash: "sh", shell: "sh", sh: "sh",
  dockerfile: "dockerfile",
};

interface ChatBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
  isLast?: boolean;
  selectedVoice?: number;
}

export function ChatBubble({ message, onRegenerate, onDelete, onEdit, isLast, selectedVoice = 0 }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [speaking, setSpeaking] = useState(false);
  const isUser = message.role === "user";
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.style.height = "auto";
      editRef.current.style.height = editRef.current.scrollHeight + "px";
    }
  }, [editing]);

  useEffect(() => {
    return () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); };
  }, []);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(true); setCodeCopied(true);
    setTimeout(() => { setCopied(false); setCodeCopied(false); }, 2000);
  };

  const handleSaveEdit = () => { onEdit?.(editContent); setEditing(false); };

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const text = message.content
      .replace(/```[\s\S]*?```/g, " code block ")
      .replace(/[*#`_>|]/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .trim();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const allVoices = window.speechSynthesis.getVoices();
    if (allVoices.length > selectedVoice) utterance.voice = allVoices[selectedVoice];
    utterance.rate = 1; utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const handleDownloadCode = (code: string, lang: string) => {
    const ext = LANG_EXTENSIONS[lang?.toLowerCase()] || "txt";
    downloadFile(code, `hemix-${Date.now()}.${ext}`, "text/plain");
  };

  const isImageMessage = message.type === "image" && message.imageUrl;
  const isGeneratingImage = message.type === "image" && message.status === "streaming" && !message.imageUrl;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      className={`group ${isUser ? "flex justify-end" : "w-full"}`}
    >
      <div className={`${isUser ? "max-w-[80%] sm:max-w-[75%]" : "w-full"}`}>
        {editing ? (
          <div className="space-y-2">
            <textarea ref={editRef} value={editContent} onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } }}
              className="w-full rounded-xl p-3 resize-none focus:outline-none text-sm"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--fg)", minHeight: "60px" }}
              autoFocus />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "var(--fg-muted)" }}>Cancel</button>
              <button onClick={handleSaveEdit} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:opacity-90">Save</button>
            </div>
          </div>
        ) : isGeneratingImage ? (
          /* === IMAGE LOADING BUBBLE — picture-sized with Generating picture... === */
          <div className="w-full max-w-sm">
            <div
              className="relative rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
              }}
            >
              {/* Animated gradient background */}
              <div
                className="absolute inset-0 opacity-30 animate-pulse"
                style={{
                  background: "linear-gradient(135deg, var(--primary, #3b82f6) 0%, var(--secondary, #8b5cf6) 100%)",
                }}
              />
              {/* Center content */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                {/* Spinner */}
                <div
                  className="w-10 h-10 rounded-full border-3 border-transparent animate-spin"
                  style={{
                    borderTopColor: "var(--primary, #3b82f6)",
                    borderBottomColor: "var(--primary, #3b82f6)",
                  }}
                />
                <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                  Generating picture...
                </p>
                {message.imagePrompt && (
                  <p className="text-xs text-center px-4 line-clamp-2" style={{ color: "var(--fg-muted)" }}>
                    {message.imagePrompt}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : isImageMessage ? (
          /* === IMAGE REVEAL — generated image with fade-in === */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="py-1"
          >
            {message.imagePrompt && (
              <p className="text-xs mb-2" style={{ color: "var(--fg-muted)" }}>
                {message.imagePrompt}
              </p>
            )}
            <div className="relative rounded-xl overflow-hidden inline-block max-w-md">
              <img
                src={message.imageUrl}
                alt={message.imagePrompt || "Generated image"}
                className="rounded-xl max-w-full"
                loading="lazy"
              />
              <a
                href={message.imageUrl}
                download="hemix-image.png"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
                title="Download image"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        ) : message.status === "streaming" && !message.content ? (
          <div className="py-2"><TypingIndicator /></div>
        ) : (
          <>
            {isUser ? (
              <div className="rounded-2xl px-4 py-2.5 text-sm"
                style={{ background: "transparent", border: "1px solid var(--input-border)", color: "var(--fg)" }}>
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              </div>
            ) : (
              <div className="markdown-body py-1">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const code = String(children).replace(/\n$/, "");
                      if (match) {
                        return (
                          <div className="relative group/code my-3">
                            <div className="flex items-center justify-between px-4 py-2 rounded-t-lg border-b"
                              style={{ background: "var(--input-bg)", borderColor: "var(--input-border)" }}>
                              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{match[1]}</span>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleDownloadCode(code, match[1])}
                                  className="text-xs flex items-center gap-1 transition-colors hover:text-white"
                                  style={{ color: "var(--fg-muted)" }} title="Download code">
                                  <Download className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleCopy(code)}
                                  className="text-xs flex items-center gap-1 transition-colors"
                                  style={{ color: "var(--fg-muted)" }}>
                                  {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  {codeCopied ? "Copied" : "Copy"}
                                </button>
                              </div>
                            </div>
                            <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div"
                              customStyle={{ margin: 0, borderRadius: "0 0 12px 12px", background: "rgba(0, 0, 0, 0.35)", fontSize: "13px" }}
                              {...props}>
                              {code}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return <code className={className} {...props}>{children}</code>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Action buttons — always visible for AI, hover for user */}
            {!editing && message.status !== "streaming" && (
              <div className={`flex items-center gap-1 mt-1.5 ${isUser ? "justify-end opacity-0 group-hover:opacity-100" : "justify-start"} transition-opacity`}>
                <button onClick={() => handleCopy(message.content)}
                  className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                  style={{ color: "var(--fg-muted)" }} title="Copy">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {!isUser && typeof window !== "undefined" && "speechSynthesis" in window && (
                  <button onClick={handleSpeak}
                    className={`p-1.5 rounded-md hover:bg-white/5 transition-colors ${speaking ? "text-primary" : ""}`}
                    style={speaking ? {} : { color: "var(--fg-muted)" }}
                    title={speaking ? "Stop" : "Read aloud"}>
                    {speaking ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}
                {isUser && onEdit && (
                  <button onClick={() => setEditing(true)}
                    className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                    style={{ color: "var(--fg-muted)" }} title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {!isUser && onRegenerate && isLast && (
                  <button onClick={onRegenerate}
                    className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                    style={{ color: "var(--fg-muted)" }} title="Regenerate">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button onClick={onDelete}
                    className="p-1.5 rounded-md hover:bg-white/5 hover:text-red-400 transition-colors"
                    style={{ color: "var(--fg-muted)" }} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
