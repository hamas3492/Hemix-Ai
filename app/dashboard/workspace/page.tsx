"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, Mail, Crown, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showSuccess } from "@/components/ui/Toast";

const TEAM_MEMBERS = [
  { name: "Alex Chen", email: "alex@hemix.ai", role: "Admin", joinedAt: "Jan 2026" },
  { name: "Sarah Kim", email: "sarah@hemix.ai", role: "Member", joinedAt: "Feb 2026" },
  { name: "James Liu", email: "james@hemix.ai", role: "Member", joinedAt: "Mar 2026" },
  { name: "Emma Davis", email: "emma@hemix.ai", role: "Viewer", joinedAt: "Jul 2026" },
];

export default function WorkspacePage() {
  const { user } = useAuth();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-white">Workspace</h1>
            <Button variant="primary" size="sm" onClick={() => showSuccess("Invite sent!")}>
              <UserPlus className="w-4 h-4" />
              Invite Member
            </Button>
          </div>
          <p className="text-sm text-muted mb-8">Manage your team and workspace settings</p>

          {/* Workspace info */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Hemix AI Team</h2>
                <p className="text-sm text-muted">{TEAM_MEMBERS.length + 1} members · Enterprise plan</p>
              </div>
            </div>
          </Card>

          {/* Invite */}
          <Card className="mb-6">
            <h3 className="text-base font-semibold text-white mb-2">Invite Team Member</h3>
            <p className="text-sm text-muted mb-4">Send an invitation to join your workspace</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@example.com"
                className="flex-1"
              />
              <Button variant="primary" onClick={() => showSuccess("Invitation sent!")}>
                <Mail className="w-4 h-4" />
                Send Invite
              </Button>
            </div>
          </Card>

          {/* Team members */}
          <h3 className="text-base font-semibold text-white mb-3">Team Members</h3>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-white/5">
              {/* Current user first */}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={user?.name || "You"} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{user?.name || "You"}</p>
                      <Badge variant="primary">You</Badge>
                    </div>
                    <p className="text-xs text-muted">{user?.email}</p>
                  </div>
                </div>
                <Badge variant="primary">
                  <Crown className="w-3 h-3" />
                  Owner
                </Badge>
              </div>

              {TEAM_MEMBERS.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="md" />
                    <div>
                      <p className="text-sm font-medium text-white">{member.name}</p>
                      <p className="text-xs text-muted">{member.email} · Joined {member.joinedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role === "Admin" && (
                      <Badge variant="primary">
                        <Shield className="w-3 h-3" />
                        Admin
                      </Badge>
                    )}
                    {member.role === "Member" && <Badge>Member</Badge>}
                    {member.role === "Viewer" && <Badge variant="default">Viewer</Badge>}
                    <Button variant="ghost" size="sm">
                      Manage
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
