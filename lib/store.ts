import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { Conversation, Message, ChatSettings, AppSettings, User, PersonalityId } from "@/types";
import { PERSONALITIES } from "@/types";
import type { SubscriptionRecord } from "@/services/payment-service";

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  searchQuery: string;
  chatSettings: ChatSettings;
  appSettings: AppSettings;
  user: User | null;

  subscription: SubscriptionRecord | null;
  dailyMessageCount: number;
  lastMessageDate: string;

  createConversation: (model: string) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  pinConversation: (id: string) => void;
  updateConversationModel: (id: string, model: string) => void;
  updateConversationPersonality: (id: string, personality: PersonalityId) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  setGenerating: (generating: boolean) => void;
  setSearchQuery: (query: string) => void;
  setChatSettings: (settings: Partial<ChatSettings>) => void;
  setAppSettings: (settings: Partial<AppSettings>) => void;
  setUser: (user: User | null) => void;
  exportConversation: (id: string) => string;

  incrementMessageCount: () => void;
  setSubscription: (subscription: SubscriptionRecord | null) => void;
  resetDailyCount: () => void;

  // UI state (not persisted)
  voiceModeOpen: boolean;
  setVoiceModeOpen: (open: boolean) => void;
}

// Note: Identity enforcement is server-side in app/api/chat/route.ts (IDENTITY_BLOCK).
// This frontend system prompt provides personality/behaviour context only.
const HEMIX_BEHAVIOR_PROMPT =
  "You are Hemix AI, a helpful and intelligent assistant. " +
  "Keep answers short by default — a few sentences or a brief list. " +
  "Only give a long, detailed answer when the user explicitly asks for more detail, a full explanation, or a guide. " +
  "When generating code, ALWAYS complete the full code — never cut off mid-way.";

const defaultChatSettings: ChatSettings = {
  temperature: 0.7,
  maxTokens: 16384,
  topP: 1,
  systemPrompt: HEMIX_BEHAVIOR_PROMPT,
  streamResponse: true,
};

const defaultAppSettings: AppSettings = {
  theme: "dark",
  language: "en",
  notifications: true,
  keyboardShortcuts: true,
  privacy: {
    saveHistory: true,
    shareData: false,
  },
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isGenerating: false,
      searchQuery: "",
      chatSettings: defaultChatSettings,
      appSettings: defaultAppSettings,
      user: null,

      subscription: null,
      dailyMessageCount: 0,
      lastMessageDate: new Date().toISOString().split("T")[0],

      voiceModeOpen: false,

      createConversation: (model: string) => {
        const id = nanoid();
        const conversation: Conversation = {
          id,
          title: "New Chat",
          messages: [],
          model,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pinned: false,
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          return {
            conversations: filtered,
            activeConversationId:
              state.activeConversationId === id
                ? filtered[0]?.id ?? null
                : state.activeConversationId,
          };
        });
      },

      renameConversation: (id: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      pinConversation: (id: string) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          ),
        }));
      },

      updateConversationModel: (id: string, model: string) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, model, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      updateConversationPersonality: (id: string, personality: PersonalityId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, personality, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      setActiveConversation: (id: string) => set({ activeConversationId: id }),

      addMessage: (conversationId: string, message: Message) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date().toISOString(),
                  title:
                    c.title === "New Chat" && message.role === "user"
                      ? message.content.slice(0, 40) + (message.content.length > 40 ? "..." : "")
                      : c.title,
                }
              : c
          ),
        }));
      },

      updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : c
          ),
        }));
      },

      deleteMessage: (conversationId: string, messageId: string) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
              : c
          ),
        }));
      },

      setGenerating: (generating: boolean) => set({ isGenerating: generating }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setChatSettings: (settings: Partial<ChatSettings>) =>
        set((state) => ({ chatSettings: { ...state.chatSettings, ...settings } })),
      setAppSettings: (settings: Partial<AppSettings>) =>
        set((state) => ({ appSettings: { ...state.appSettings, ...settings } })),
      setUser: (user: User | null) => set({ user }),

      exportConversation: (id: string) => {
        const conv = get().conversations.find((c) => c.id === id);
        if (!conv) return "";
        const lines = [`# ${conv.title}`, ``, `Created: ${conv.createdAt}`, `Model: ${conv.model}`, ``];
        for (const msg of conv.messages) {
          lines.push(`## ${msg.role === "user" ? "You" : "Hemix AI"}`);
          lines.push(msg.content);
          lines.push("");
        }
        return lines.join("\n");
      },

      incrementMessageCount: () => {
        const today = new Date().toISOString().split("T")[0];
        const { lastMessageDate, dailyMessageCount } = get();
        if (lastMessageDate !== today) {
          set({ dailyMessageCount: 1, lastMessageDate: today });
        } else {
          set({ dailyMessageCount: dailyMessageCount + 1 });
        }
      },

      setSubscription: (subscription: SubscriptionRecord | null) => {
        set((state) => {
          if (subscription?.status === "active" && state.user) {
            return {
              subscription,
              user: { ...state.user, plan: subscription.plan },
            };
          }
          return { subscription };
        });
      },

      resetDailyCount: () => {
        const today = new Date().toISOString().split("T")[0];
        set({ dailyMessageCount: 0, lastMessageDate: today });
      },

      setVoiceModeOpen: (open: boolean) => set({ voiceModeOpen: open }),
    }),
    {
      name: "hemix-storage",
      version: 4,
      migrate: (persisted: any, version: number) => {
        if (version < 2 && persisted?.chatSettings) {
          persisted.chatSettings.systemPrompt = undefined;
        }
        if (version < 4 && persisted?.chatSettings) {
          // Update to new behavior-only system prompt (identity is now server-side)
          persisted.chatSettings.systemPrompt = undefined;
        }
        return persisted;
      },
    }
  )
);

// Helper: get system prompt with personality
// Note: Identity is enforced server-side. This returns behavior/personality context only.
export function getSystemPrompt(chatSettings: ChatSettings, personality?: PersonalityId): string {
  if (personality && PERSONALITIES[personality]) {
    return `${HEMIX_BEHAVIOR_PROMPT}\n\n${PERSONALITIES[personality].prompt}`;
  }
  return chatSettings.systemPrompt || HEMIX_BEHAVIOR_PROMPT;
}
