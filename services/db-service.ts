import { supabase } from "@/lib/supabase-client";
import type { Conversation, Message } from "@/types";

interface DBConversationRow {
  id: string;
  user_id: string;
  title: string;
  model: string;
  pinned: boolean;
  system_prompt?: string | null;
  created_at: string;
  updated_at: string;
  messages?: DBMessageRow[];
}

interface DBMessageRow {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
  status?: "sending" | "streaming" | "complete" | "error" | null;
  created_at: string;
}

function mapDBMessageToMessage(row: DBMessageRow): Message {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    model: row.model || undefined,
    status: (row.status as Message["status"]) || "complete",
    createdAt: row.created_at,
  };
}

function mapDBConversationToConversation(row: DBConversationRow): Conversation {
  return {
    id: row.id,
    title: row.title || "New Chat",
    model: row.model,
    pinned: row.pinned ?? false,
    systemPrompt: row.system_prompt || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: row.messages ? row.messages.map(mapDBMessageToMessage) : [],
  };
}

export async function createConversation(
  userId: string,
  model: string,
  title: string = "New Chat",
  systemPrompt?: string
): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      model,
      title,
      system_prompt: systemPrompt,
      pinned: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }

  return mapDBConversationToConversation({ ...data, messages: [] });
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, messages(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }

  return (data || []).map((row) => {
    const sortedMessages = (row.messages || []).sort(
      (a: DBMessageRow, b: DBMessageRow) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return mapDBConversationToConversation({ ...row, messages: sortedMessages });
  });
}

export async function getConversation(
  id: string,
  userId: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, messages(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  const sortedMessages = (data.messages || []).sort(
    (a: DBMessageRow, b: DBMessageRow) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return mapDBConversationToConversation({ ...data, messages: sortedMessages });
}

export async function updateConversation(
  id: string,
  userId: string,
  updates: Partial<Conversation>
): Promise<Conversation | null> {
  const dbUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.model !== undefined) dbUpdates.model = updates.model;
  if (updates.pinned !== undefined) dbUpdates.pinned = updates.pinned;
  if (updates.systemPrompt !== undefined) dbUpdates.system_prompt = updates.systemPrompt;

  const { data, error } = await supabase
    .from("conversations")
    .update(dbUpdates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*, messages(*)")
    .single();

  if (error || !data) {
    console.error("Error updating conversation:", error);
    return null;
  }

  const sortedMessages = (data.messages || []).sort(
    (a: DBMessageRow, b: DBMessageRow) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return mapDBConversationToConversation({ ...data, messages: sortedMessages });
}

export async function deleteConversation(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
}

export async function addMessage(
  conversationId: string,
  message: Partial<Message> & { role: Message["role"]; content: string }
): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      model: message.model,
      status: message.status || "complete",
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding message:", error);
    throw error;
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return mapDBMessageToMessage(data);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }

  return (data || []).map(mapDBMessageToMessage);
}

export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("conversation_id", conversationId);

  if (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
}

export async function updateMessage(
  conversationId: string,
  messageId: string,
  updates: Partial<Message>
): Promise<Message | null> {
  const dbUpdates: Record<string, any> = {};

  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.model !== undefined) dbUpdates.model = updates.model;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { data, error } = await supabase
    .from("messages")
    .update(dbUpdates)
    .eq("id", messageId)
    .eq("conversation_id", conversationId)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating message:", error);
    return null;
  }

  return mapDBMessageToMessage(data);
}

export async function pinConversation(
  id: string,
  userId: string,
  pinned: boolean
): Promise<Conversation | null> {
  return updateConversation(id, userId, { pinned });
}

export async function renameConversation(
  id: string,
  userId: string,
  title: string
): Promise<Conversation | null> {
  return updateConversation(id, userId, { title });
}

export const dbService = {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  addMessage,
  getMessages,
  deleteMessage,
  updateMessage,
  pinConversation,
  renameConversation,
};

export default dbService;
