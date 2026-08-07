"use client";

import { motion } from "framer-motion";
import { User, Copy, Check, RotateCcw, Trash2, Pencil, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Message } from "@/types";
import { copyToClipboard, formatTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { TypingIndicator } from "@/components/ui/Spinner";
import { useState } from "react";

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {isUser ? (
        <Avatar name="You" size="sm" className="mt-1" />
      ) : (
        <div className="w-8 h-8 rounded-full overflow-hidden mt-1 shrink-0">
          <img src="/assets/icon.png" alt="Hemix AI" className="w-full h-full object-cover" />
        </div>
      )}

      <div className={`flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {isUser ? "You" : "Hemix AI"}
          </span>
          {message.model && (
            <span className="text-xs text-muted/60">· {message.model}</span>
          )}
          <span className="text-xs text-muted/60">{formatTime(message.createdAt)}</span>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary/10 border border-primary/20"
              : "glass"
          }`}
        >
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent text-white resize-none focus:outline-none min-h-[80px]"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs text-muted hover:text-white px-3 py-1.5 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-600"
                >
                  Save
                </button>
              </div>
            </div>
          ) : message.status === "streaming" && !message.content ? (
            <TypingIndicator />
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const code = String(children).replace(/\n$/, "");
                    if (match) {
                      return (
                        <div className="relative group my-4">
                          <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-t-lg border-b border-white/5">
                            <span className="text-xs text-muted">{match[1]}</span>
                            <button
                              onClick={() => handleCopy(code)}
                              className="text-xs text-muted hover:text-white flex items-center gap-1 transition-colors"
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
                              background: "rgba(0, 0, 0, 0.4)",
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
        </div>

        {!editing && message.status !== "streaming" && (
          <div className={`flex items-center gap-1 ${isUser ? "justify-end" : "justify-start"}`}>
            <button
              onClick={() => handleCopy(message.content)}
              className="p-1.5 text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {isUser && onEdit && (
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {!isUser && onRegenerate && isLast && (
              <button
                onClick={onRegenerate}
                className="p-1.5 text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                title="Regenerate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-muted hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
