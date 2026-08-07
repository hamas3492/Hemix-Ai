"use client";

import { motion } from "framer-motion";
import { Cpu, Check, DollarSign, Zap, Brain, Code2 } from "lucide-react";
import { AI_MODELS } from "@/lib/models";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { showSuccess } from "@/components/ui/Toast";

export default function ModelsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white mb-1">AI Models</h1>
          <p className="text-sm text-muted mb-8">Browse and compare all available AI models</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AI_MODELS.map((model, i) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-white">{model.name}</h3>
                          {model.badge && (
                            <Badge variant="primary">{model.badge}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted capitalize">{model.provider}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted mb-4">{model.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {model.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-muted border border-white/5"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${model.inputPrice}/M in
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        ${model.outputPrice}/M out
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {(model.contextWindow / 1000).toFixed(0)}K ctx
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showSuccess(`Switched to ${model.name}`)}
                    >
                      Use
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
