"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Plus, Copy, Check, Trash2, Eye, EyeOff } from "lucide-react";
import { nanoid } from "nanoid";
import type { ApiKey } from "@/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { showSuccess, showError } from "@/components/ui/Toast";
import { useCopyToClipboard } from "@/hooks";
import { formatDate } from "@/lib/utils";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: nanoid(), name: "Production", key: "hk_prod_a1b2c3d4e5f6g7h8i9j0", createdAt: "2026-07-15T10:00:00Z", lastUsed: "2026-08-06T14:30:00Z", status: "active" },
    { id: nanoid(), name: "Development", key: "hk_dev_k1l2m3n4o5p6q7r8s9t0", createdAt: "2026-06-01T08:00:00Z", status: "active" },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copied, copy] = useCopyToClipboard();

  const handleCreate = () => {
    if (!newKeyName.trim()) {
      showError("Please enter a key name");
      return;
    }
    const newKey: ApiKey = {
      id: nanoid(),
      name: newKeyName.trim(),
      key: `hk_${nanoid(24)}`,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    setKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
    setShowCreate(false);
    showSuccess("API key created successfully");
  };

  const handleRevoke = (id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: "revoked" } : k)));
    showSuccess("API key revoked");
  };

  const handleDelete = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    showSuccess("API key deleted");
  };

  const maskKey = (key: string, visible: boolean) => {
    if (visible) return key;
    return key.slice(0, 8) + "•".repeat(16) + key.slice(-4);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-white">API Keys</h1>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              Create Key
            </Button>
          </div>
          <p className="text-sm text-muted mb-8">Manage your API keys for programmatic access</p>

          <div className="space-y-3">
            {keys.map((key, i) => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Key className="w-4 h-4 text-primary" />
                        <h3 className="text-base font-semibold text-white">{key.name}</h3>
                        <Badge variant={key.status === "active" ? "success" : "default"}>
                          {key.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs text-muted font-mono bg-black/30 px-2 py-1 rounded">
                          {maskKey(key.key, visibleKeys[key.id])}
                        </code>
                        <button
                          onClick={() => setVisibleKeys((prev) => ({ ...prev, [key.id]: !prev[key.id] }))}
                          className="text-muted hover:text-white transition-colors"
                        >
                          {visibleKeys[key.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            copy(key.key);
                            showSuccess("Key copied to clipboard");
                          }}
                          className="text-muted hover:text-white transition-colors"
                        >
                          {copied === key.key ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                        <span>Created: {formatDate(key.createdAt)}</span>
                        {key.lastUsed && <span>Last used: {formatDate(key.lastUsed)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {key.status === "active" && (
                        <Button variant="ghost" size="sm" onClick={() => handleRevoke(key.id)}>
                          Revoke
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(key.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {keys.length === 0 && (
            <div className="text-center py-16">
              <Key className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted mb-4">No API keys yet</p>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                Create your first key
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create API Key" description="Generate a new API key for programmatic access">
        <Input
          label="Key Name"
          placeholder="e.g. Production, Development"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleCreate}>
            Create Key
          </Button>
        </div>
      </Modal>
    </div>
  );
}
