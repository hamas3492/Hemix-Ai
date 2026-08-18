"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, RotateCcw, Pencil, Volume2, Pause, Download,
  ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Maximize2, Wand2,
  Image as ImageIcon, AlertCircle, RefreshCw, Square, FileText, Paperclip,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Message } from "@/types";
import { copyToClipboard, downloadFile, cn } from "@/lib/utils";
import { TypingIndicator } from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/Tooltip";
import { useState, useRef, useEffect, memo } from "react";

const LANG_EXT: Record<string, string> = {
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
  onLike?: () => void;
  onDislike?: () => void;
  onShare?: () => void;
  onImageClick?: (url: string) => void;
  onImageRetry?: () => void;
  onImageVariation?: () => void;
  onImageEdit?: () => void;
  isLast?: boolean;
  selectedVoice?: number;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const ChatBubble = memo(function ChatBubble({
  message, onRegenerate, onDelete, onEdit, onLike, onDislike, onShare,
  onImageClick, onImageRetry, onImageVariation, onImageEdit,
  isLast, selectedVoice = 0, onSpeak, isSpeaking,
}: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showMore, setShowMore] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isUser = message.role === "user";
  const editRef = useRef<HTMLTextAreaElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.style.height = "auto";
      editRef.current.style.height = editRef.current.scrollHeight + "px";
    }
  }, [editing]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(true); setCodeCopied(true);
    setTimeout(() => { setCopied(false); setCodeCopied(false); }, 2000);
  };

  const handleSaveEdit = () => { onEdit?.(editContent); setEditing(false); };

  const handleSpeak = () => {
    if (onSpeak) { onSpeak(message.content); return; }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); return; }
    const text = message.content.replace(/```[\s\S]*?```/g, " code block ").replace(/[*#`_>|]/g, "").trim();
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > selectedVoice) u.voice = voices[selectedVoice];
    u.onend = () => {}; u.onerror = () => {};
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const handleDownloadCode = (code: string, lang: string) => {
    const ext = LANG_EXT[lang?.toLowerCase()] || "txt";
    downloadFile(code, `hemix-${Date.now()}.${ext}`, "text/plain");
  };

  const isImageMessage = message.type === "image" && message.imageUrl;
  const isGeneratingImage = message.type === "image" && message.status === "streaming" && !message.imageUrl;
  const isImageError = message.type === "image" && message.status === "error";
  const isImageCancelled = message.type === "image" && message.status === "error" && message.content?.includes("cancelled");

  // === ACTION BUTTON COMPONENT ===
  const ActionBtn = ({ icon: Icon, label, onClick, active }: any) => (
    <Tooltip content={label} side="top">
      <button
        onClick={onClick}
        className={cn("p-1.5 rounded-md hover:bg-white/5 transition-colors touch-target no-select",
          active ? "text-primary" : "")}
        style={!active ? { color: "var(--fg-muted)" } : {}}
        aria-label={label}
      >
        <Icon className="w-3.5 h-3.5" />
      </button>
    </Tooltip>
  );

  // === IMAGE ACTIONS ===
  const ImageActions = () => (
    <div className="flex items-center gap-0.5 mt-2 flex-wrap">
      <button onClick={() => onImageClick?.(message.imageUrl!)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors touch-target"
        style={{ color: "var(--fg-muted)" }} aria-label="Open fullscreen">
        <Maximize2 className="w-3.5 h-3.5" /> Open
      </button>
      <a href={message.imageUrl} download="hemix-image.png" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors touch-target"
        style={{ color: "var(--fg-muted)" }} aria-label="Download image">
        <Download className="w-3.5 h-3.5" /> Download
      </a>
      <button onClick={() => copyToClipboard(message.imageUrl!)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors touch-target"
        style={{ color: "var(--fg-muted)" }} aria-label="Copy image URL">
        <Copy className="w-3.5 h-3.5" /> Copy
      </button>
      {onImageVariation && (
        <button onClick={onImageVariation}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors touch-target"
          style={{ color: "var(--fg-muted)" }} aria-label="Generate variation">
          <ImageIcon className="w-3.5 h-3.5" /> Variation
        </button>
      )}
      {onImageEdit && (
        <button onClick={onImageEdit}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors touch-target"
          style={{ color: "var(--fg-muted)" }} aria-label="Edit image">
          <Wand2 className="w-3.5 h-3.5" /> Edit
        </button>
      )}
      {onShare && (
        <button onClick={onShare}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs hover:bg-white/5 transition-colors touch-target"
          style={{ color: "var(--fg-muted)" }} aria-label="Share image">
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      className={cn("group", isUser ? "flex justify-end" : "w-full")}
    >
      <div className={cn(isUser ? "max-w-[80%] sm:max-w-[75%]" : "w-full")}>
        {/* === EDITING MODE === */}
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
          /* === IMAGE GENERATING STATE — animated skeleton === */
          <div className="w-full max-w-sm">
            <div className="relative rounded-2xl overflow-hidden skeleton-image"
              style={{ width: "100%", aspectRatio: "1 / 1", border: "1px solid var(--input-border)" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "var(--primary, #3b82f6)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Generating picture...</p>
                {message.imagePrompt && (
                  <p className="text-xs text-center px-6 line-clamp-2" style={{ color: "var(--fg-muted)" }}>{message.imagePrompt}</p>
                )}
              </div>
            </div>
          </div>
        ) : isImageCancelled ? (
          /* === IMAGE CANCELLED STATE === */
          <div className="w-full max-w-sm">
            <div className="rounded-2xl p-6 flex flex-col items-center gap-3"
              style={{ border: "1px solid var(--input-border)", background: "var(--input-bg)" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--input-bg)" }}>
                <Square className="w-5 h-5" style={{ color: "var(--fg-muted)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--fg)" }}>Image generation cancelled.</p>
              {onImageRetry && (
                <button onClick={onImageRetry}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90 transition-opacity touch-target">
                  <RotateCcw className="w-3.5 h-3.5" /> Try Again
                </button>
              )}
            </div>
          </div>
        ) : isImageError ? (
          /* === IMAGE FAILED STATE === */
          <div className="w-full max-w-sm">
            <div className="rounded-2xl p-6 flex flex-col items-center gap-3"
              style={{ border: "1px solid var(--input-border)", background: "var(--input-bg)" }}>
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm" style={{ color: "var(--fg)" }}>Image generation failed. Try again.</p>
              {onImageRetry && (
                <button onClick={onImageRetry}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90 transition-opacity touch-target">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
              )}
            </div>
          </div>
        ) : isImageMessage ? (
          /* === IMAGE COMPLETE — reveal with actions === */
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="py-1">
            {message.imagePrompt && (
              <p className="text-xs mb-2" style={{ color: "var(--fg-muted)" }}>{message.imagePrompt}</p>
            )}
            <div className="relative rounded-xl overflow-hidden inline-block max-w-md group/img cursor-pointer"
              onClick={() => onImageClick?.(message.imageUrl!)}>
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center skeleton-image"
                  style={{ width: "320px", height: "320px" }}>
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--primary, #3b82f6)" }} />
                </div>
              )}
              <img src={message.imageUrl} alt={message.imagePrompt || "Generated image"}
                className="rounded-xl max-w-full transition-opacity duration-300"
                style={{ opacity: imgLoaded ? 1 : 0 }}
                onLoad={() => setImgLoaded(true)}
                loading="lazy" />
              <div className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <ImageActions />
          </motion.div>
        ) : message.status === "streaming" && !message.content ? (
          <div className="py-2"><TypingIndicator /></div>
        ) : (
          /* === TEXT MESSAGE === */
          <>
            {/* === ATTACHMENTS (shown above message text, like ChatGPT) === */}
            {isUser && message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1.5 justify-end">
                {message.attachments.map((att) => {
                  const isImage = att.type.startsWith("image/");
                  const fileSize = att.size > 1024 * 1024
                    ? (att.size / (1024 * 1024)).toFixed(1) + " MB"
                    : att.size > 1024
                      ? (att.size / 1024).toFixed(0) + " KB"
                      : att.size + " B";
                  return (
                    <div key={att.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl border max-w-[280px]"
                      style={{ background: "var(--input-bg)", borderColor: "var(--input-border)" }}>
                      {isImage && att.url ? (
                        <img src={att.url} alt={att.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "var(--input-bg)" }}>
                          <FileText className="w-4.5 h-4.5" style={{ color: "var(--fg-muted)" }} />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium truncate" style={{ color: "var(--fg)" }}>{att.name}</span>
                        <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>{fileSize}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {isUser ? (
              message.content.trim() ? (
                <div className="rounded-2xl px-4 py-2.5 text-sm"
                  style={{ background: "transparent", border: "1px solid var(--input-border)", color: "var(--fg)" }}>
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                </div>
              ) : null
            ) : (
              <div className="markdown-body py-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
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
                                className="text-xs flex items-center gap-1 hover:text-white transition-colors" style={{ color: "var(--fg-muted)" }} title="Download">
                                <Download className="w-3 h-3" />
                              </button>
                              <button onClick={() => handleCopy(code)}
                                className="text-xs flex items-center gap-1 transition-colors" style={{ color: "var(--fg-muted)" }}>
                                {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {codeCopied ? "Copied" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div"
                            customStyle={{ margin: 0, borderRadius: "0 0 12px 12px", background: "rgba(0,0,0,0.35)", fontSize: "13px" }}
                            {...props}>{code}</SyntaxHighlighter>
                        </div>
                      );
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                }}>{message.content}</ReactMarkdown>
              </div>
            )}

            {/* === MESSAGE ACTIONS === */}
            {!editing && message.status !== "streaming" && (
              <div className={cn(
                "flex items-center gap-0.5 mt-1.5 transition-opacity",
                isUser
                  ? "justify-end opacity-60 lg:opacity-0 lg:group-hover:opacity-100"
                  : "justify-start opacity-60 lg:opacity-0 lg:group-hover:opacity-100"
              )}>
                {/* Copy — always visible */}
                <ActionBtn icon={copied ? Check : Copy} label="Copy" onClick={() => handleCopy(message.content)} />

                {/* AI message actions */}
                {!isUser && (
                  <>
                    {/* Read aloud / Stop */}
                    <ActionBtn icon={isSpeaking ? Pause : Volume2} label={isSpeaking ? "Stop speaking" : "Read aloud"}
                      onClick={handleSpeak} active={isSpeaking} />
                    {/* Like */}
                    <ActionBtn icon={ThumbsUp} label="Like" onClick={onLike} active={message.liked} />
                    {/* Dislike */}
                    <ActionBtn icon={ThumbsDown} label="Dislike" onClick={onDislike} active={message.disliked} />
                    {/* Regenerate — only on last message */}
                    {onRegenerate && isLast && <ActionBtn icon={RotateCcw} label="Regenerate" onClick={onRegenerate} />}
                    {/* Share */}
                    {onShare && <ActionBtn icon={Share2} label="Share" onClick={onShare} />}
                    {/* More menu */}
                    <div ref={moreRef} className="relative">
                      <ActionBtn icon={MoreHorizontal} label="More" onClick={() => setShowMore(!showMore)} />
                      <AnimatePresence>
                        {showMore && (
                          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border shadow-2xl py-1"
                            style={{ background: "var(--card-bg)", borderColor: "var(--input-border)" }}>
                            <button onClick={() => { handleCopy(message.content); setShowMore(false); }}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 flex items-center gap-2" style={{ color: "var(--fg)" }}>
                              <Copy className="w-3.5 h-3.5" /> Copy text
                            </button>
                            {onShare && (
                              <button onClick={() => { onShare(); setShowMore(false); }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 flex items-center gap-2" style={{ color: "var(--fg)" }}>
                                <Share2 className="w-3.5 h-3.5" /> Share
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}

                {/* User message actions — edit only, no delete (whole chats are deleted from the sidebar) */}
                {isUser && onEdit && (
                  <ActionBtn icon={Pencil} label="Edit" onClick={() => setEditing(true)} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
});