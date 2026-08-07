"use client";

import { motion } from "framer-motion";
import {
  Palette,
  Globe,
  Bell,
  Keyboard,
  Shield,
  Download,
  Trash2,
  Moon,
  Sun,
  Check,
} from "lucide-react";
import { useChatStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { showSuccess, showError } from "@/components/ui/Toast";
import { authService } from "@/services/auth-service";
import { useRouter } from "next/navigation";
import { downloadFile } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { appSettings, setAppSettings, chatSettings, setChatSettings, conversations, exportConversation } = useChatStore();
  const { user } = useAuth();
  const router = useRouter();

  const handleExportData = () => {
    const allData = conversations.map((c) => exportConversation(c.id)).join("\n\n---\n\n");
    downloadFile(allData || "No data yet", "hemix-export.md", "text/markdown");
    showSuccess("Data exported successfully");
  };

  const handleDeleteAccount = () => {
    if (confirm("Are you sure? This will permanently delete your account and all data.")) {
      authService.deleteAccount();
      showSuccess("Account deleted");
      router.push("/");
    }
  };

  const settings = [
    {
      icon: Palette,
      title: "Appearance",
      description: "Customize how Hemix AI looks",
      content: (
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setAppSettings({ theme: "dark" })}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
              appSettings.theme === "dark"
                ? "border-primary/50 bg-primary/10 text-white"
                : "border-white/10 text-muted hover:text-white"
            )}
          >
            <Moon className="w-4 h-4" />
            Dark
            {appSettings.theme === "dark" && <Check className="w-3 h-3 text-primary" />}
          </button>
          <button
            onClick={() => setAppSettings({ theme: "light" })}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
              appSettings.theme === "light"
                ? "border-primary/50 bg-primary/10 text-white"
                : "border-white/10 text-muted hover:text-white"
            )}
          >
            <Sun className="w-4 h-4" />
            Light
          </button>
        </div>
      ),
    },
    {
      icon: Globe,
      title: "Language",
      description: "Set your preferred language",
      content: (
        <select
          value={appSettings.language}
          onChange={(e) => setAppSettings({ language: e.target.value })}
          className="mt-4 w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
        </select>
      ),
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage your notification preferences",
      content: (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-white">Enable notifications</span>
          <button
            onClick={() => setAppSettings({ notifications: !appSettings.notifications })}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              appSettings.notifications ? "bg-primary" : "bg-white/10"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                appSettings.notifications ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      ),
    },
    {
      icon: Keyboard,
      title: "Keyboard Shortcuts",
      description: "Enable keyboard shortcuts for faster navigation",
      content: (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-white">Enable shortcuts</span>
          <button
            onClick={() => setAppSettings({ keyboardShortcuts: !appSettings.keyboardShortcuts })}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors",
              appSettings.keyboardShortcuts ? "bg-primary" : "bg-white/10"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform",
                appSettings.keyboardShortcuts ? "translate-x-6" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
      ),
    },
    {
      icon: Shield,
      title: "Privacy",
      description: "Control your data and privacy",
      content: (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white">Save conversation history</span>
              <p className="text-xs text-muted mt-0.5">Store conversations locally for future reference</p>
            </div>
            <button
              onClick={() => setAppSettings({ privacy: { ...appSettings.privacy, saveHistory: !appSettings.privacy.saveHistory } })}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                appSettings.privacy.saveHistory ? "bg-primary" : "bg-white/10"
              )}
            >
              <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", appSettings.privacy.saveHistory ? "translate-x-6" : "translate-x-0.5")} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-white">Share usage data</span>
              <p className="text-xs text-muted mt-0.5">Help improve Hemix AI by sharing anonymous data</p>
            </div>
            <button
              onClick={() => setAppSettings({ privacy: { ...appSettings.privacy, shareData: !appSettings.privacy.shareData } })}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                appSettings.privacy.shareData ? "bg-primary" : "bg-white/10"
              )}
            >
              <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", appSettings.privacy.shareData ? "translate-x-6" : "translate-x-0.5")} />
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
          <p className="text-sm text-muted mb-8">Customize your Hemix AI experience</p>

          <div className="space-y-4">
            {settings.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card hover>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-white">{s.title}</h3>
                        <p className="text-sm text-muted">{s.description}</p>
                        {s.content}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {/* Chat settings */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card hover>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white">Chat Defaults</h3>
                    <p className="text-sm text-muted">Default settings for new conversations</p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="text-sm text-white">Temperature: {chatSettings.temperature}</label>
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.1}
                          value={chatSettings.temperature}
                          onChange={(e) => setChatSettings({ temperature: parseFloat(e.target.value) })}
                          className="w-full mt-1 accent-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white">Max Tokens: {chatSettings.maxTokens}</label>
                        <input
                          type="range"
                          min={256}
                          max={8192}
                          step={256}
                          value={chatSettings.maxTokens}
                          onChange={(e) => setChatSettings({ maxTokens: parseInt(e.target.value) })}
                          className="w-full mt-1 accent-primary"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white">System Prompt</label>
                        <textarea
                          value={chatSettings.systemPrompt}
                          onChange={(e) => setChatSettings({ systemPrompt: e.target.value })}
                          rows={3}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Data management */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card hover>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white">Export Data</h3>
                    <p className="text-sm text-muted">Download all your conversations</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleExportData}>
                      <Download className="w-4 h-4" />
                      Export All Data
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Danger zone */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="glass-card p-6 border-red-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white">Delete Account</h3>
                    <p className="text-sm text-muted">Permanently delete your account and all data</p>
                    <Button variant="destructive" size="sm" className="mt-4" onClick={handleDeleteAccount}>
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
