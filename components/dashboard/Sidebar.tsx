"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  MessageSquare,
  Settings,
  Key,
  Cpu,
  CreditCard,
  Users,
  LogOut,
  Pin,
  Trash2,
  Pencil,
  X,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { useChatStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { useDebounce } from "@/hooks";
import { cn, relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { showSuccess } from "@/components/ui/Toast";

const NAV_ITEMS = [
  { label: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { label: "Models", href: "/dashboard/models", icon: Cpu },
  { label: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { label: "Workspace", href: "/dashboard/workspace", icon: Users },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    renameConversation,
    pinConversation,
    searchQuery,
    setSearchQuery,
  } = useChatStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 200);

  const handleNewChat = () => {
    createConversation("gpt-4o-mini");
    setMobileOpen(false);
  };

  const filtered = conversations.filter((c) => {
    if (!debouncedSearch) return true;
    return c.title.toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  const handleRename = () => {
    if (renameId && renameValue.trim()) {
      renameConversation(renameId, renameValue.trim());
    }
    setRenameId(null);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            <img src="/assets/icon.png" alt="Hemix AI" className="w-full h-full object-cover" />
          </div>
          {!collapsed && <span className="text-lg font-bold text-white">Hemix AI</span>}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block text-muted hover:text-white transition-colors p-1"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-muted hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 mb-3">
        <Button
          variant="primary"
          className={cn("w-full", collapsed && "px-0")}
          onClick={handleNewChat}
        >
          <Plus className="w-4 h-4" />
          {!collapsed && "New Chat"}
        </Button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2 no-scrollbar">
        {!collapsed && pinned.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-muted/60 px-2 py-1 uppercase tracking-wider">Pinned</p>
            {pinned.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConversationId}
                collapsed={collapsed}
                onClick={() => {
                  router.push(`/dashboard/chat?c=${conv.id}`);
                  setMobileOpen(false);
                }}
                onDelete={() => deleteConversation(conv.id)}
                onPin={() => pinConversation(conv.id)}
                onRename={() => {
                  setRenameId(conv.id);
                  setRenameValue(conv.title);
                }}
              />
            ))}
          </div>
        )}

        {!collapsed && unpinned.length > 0 && (
          <div>
            <p className="text-xs text-muted/60 px-2 py-1 uppercase tracking-wider">Recent</p>
            {unpinned.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConversationId}
                collapsed={collapsed}
                onClick={() => {
                  router.push(`/dashboard/chat?c=${conv.id}`);
                  setMobileOpen(false);
                }}
                onDelete={() => deleteConversation(conv.id)}
                onPin={() => pinConversation(conv.id)}
                onRename={() => {
                  setRenameId(conv.id);
                  setRenameValue(conv.title);
                }}
              />
            ))}
          </div>
        )}

        {!collapsed && conversations.length === 0 && (
          <div className="text-center py-8 text-sm text-muted">
            No conversations yet.
            <br />
            Start a new chat!
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="border-t border-white/5 p-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted hover:text-white hover:bg-white/5",
                collapsed && "justify-center"
              )}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar name={user?.name || "User"} size="sm" />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-muted hover:text-red-400 transition-colors p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 glass-strong rounded-lg p-2"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-full glass border-r border-white/5 transition-all duration-300",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 glass-strong z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Rename modal */}
      <Modal open={!!renameId} onClose={() => setRenameId(null)} title="Rename conversation">
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          placeholder="Conversation name"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
        />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setRenameId(null)}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleRename}>
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
}

interface ConversationItemProps {
  conv: { id: string; title: string; pinned: boolean; updatedAt: string; messages: { role: string; content: string }[] };
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  onDelete: () => void;
  onPin: () => void;
  onRename: () => void;
}

function ConversationItem({ conv, active, collapsed, onClick, onDelete, onPin, onRename }: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-0.5",
        active ? "bg-primary/10 text-primary" : "text-muted hover:text-white hover:bg-white/5",
        collapsed && "justify-center"
      )}
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{conv.title}</p>
            <p className="text-[10px] text-muted/60">{relativeTime(conv.updatedAt)}</p>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onPin(); }}
              className="p-1 hover:text-primary"
            >
              <Pin className={cn("w-3 h-3", conv.pinned && "fill-current text-primary")} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRename(); }}
              className="p-1 hover:text-white"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); showSuccess("Conversation deleted"); }}
              className="p-1 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
