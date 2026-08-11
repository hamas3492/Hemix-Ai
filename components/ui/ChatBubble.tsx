"use client";

import { motion } from "framer-motion";
import { Copy, Check, RotateCcw, Trash2, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Message } from "@/types";
import { copyToClipboard } from "@/lib/utils";
import { TypingIndicator } from "@/components/ui/Spinner";
import { useState, useRef, useEffect } from "react";

interface ChatBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onEdit?: (newContent: string) => void;
  isLast?: boolean;
}

export function ChatBubble({ message, onRegenerate, onDelete, onEdit, isLast }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === "user";
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.style.height = "auto";
      editRef.current.style.height = editRef.current.scrollHeight + "px";
    }
  }, [editing]);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    onEdit?.(editContent);
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`group ${isUser ? "flex justify-end" : "w-full"}`}
    >
      <div className={`${isUser ? "max-w-[80%] sm:max-w-[75%]" : "w-full"}`}>
        {editing ? (
          <div className="space-y-2">
            <textarea
              ref={editRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
              }}
              className="w-full rounded-xl p-3 resize-none focus:outline-none text-sm"
              style={{
                background: "var(--input-bg)",
                border: "1px solid var(--input-border)",
                color: "var(--fg)",
                minHeight: "60px",
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: "var(--fg-muted)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        ) : message.status === "streaming" && !message.content ? (
          <div className="py-2">
            <TypingIndicator />
          </div>
        ) : (
          <>
            {/* User message: subtle bubble */}
            {isUser ? (
              <div
                className="rounded-2xl px-4 py-2.5 text-sm"
                style={{
                  background: "transparent",
                  border: "1px solid var(--input-border)",
                  color: "var(--fg)",
                }}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              </div>
            ) : (
              /* AI message: plain text like ChatGPT */
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
                            <div
                              className="flex items-center justify-between px-4 py-2 rounded-t-lg border-b"
                              style={{
                                background: "var(--input-bg)",
                                borderColor: "var(--input-border)",
                              }}
                            >
                              <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                                {match[1]}
                              </span>
                              <button
                                onClick={() => handleCopy(code)}
                                className="text-xs flex items-center gap-1 transition-colors"
                                style={{ color: "var(--fg-muted)" }}
                              >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? "Copied" : "Copy"}
                              </button>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: "0 0 12px 12px",
                                background: "rgba(0, 0, 0, 0.35)",
                                fontSize: "13px",
                              }}
                              {...props}
                            >
                              {code}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Action buttons — appear on hover, ChatGPT-style */}
            {!editing && message.status !== "streaming" && (
              <div
                className={`flex items-center gap-0.5 mt-1 ${
                  isUser ? "justify-end" : "justify-start"
                } opacity-0 group-hover:opacity-100 transition-opacity`}
              >
                <button
                  onClick={() => handleCopy(message.content)}
                  className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                  style={{ color: "var(--fg-muted)" }}
                  title="Copy"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {isUser && onEdit && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                    style={{ color: "var(--fg-muted)" }}
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {!isUser && onRegenerate && isLast && (
                  <button
                    onClick={onRegenerate}
                    className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
                    style={{ color: "var(--fg-muted)" }}
                    title="Regenerate"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="p-1.5 rounded-md hover:bg-white/5 hover:text-red-400 transition-colors"
                    style={{ color: "var(--fg-muted)" }}
                    title="Delete"
                  >
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
