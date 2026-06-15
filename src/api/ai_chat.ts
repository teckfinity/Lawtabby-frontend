import { apiClient, getAuthToken } from "./config";
import type { ResearchMode } from "@/constants/researchModes";
import type { ChatStructuredResponse, ConversationMemory } from "@/types/chatResearch";

export type ChatSource = {
  title: string;
  court?: string;
  author?: string;
  date?: string;
  url?: string;
  excerpt?: string;
  description?: string;
  source_type: "case_law" | "external_reference";
  influence_score?: number;
  citation?: string;
};

export type ConversationSummary = {
  conversation_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  research_mode: string;
  message_count: number;
};

export type ChatMessageResponse = {
  id: number;
  role: "ai";
  content: string;
  created_at: string;
  sources?: ChatSource[];
  external_references?: ChatSource[];
  rag_used?: boolean;
  structured?: ChatStructuredResponse;
  intent?: string;
  confidence?: number;
};

export type SendChatMessageResult = {
  message: ChatMessageResponse;
  conversationId?: number;
  conversationTitle?: string;
  sources: ChatSource[];
  external_references: ChatSource[];
  rag_used: boolean;
  structured?: ChatStructuredResponse;
  intent?: string;
  confidence?: number;
  memory?: ConversationMemory;
};

export const LEGAL_CHAT_MEMORY_KEY = "legal_chat_matter_memory";
export const LEGAL_CHAT_ACTIVE_KEY = "legal_chat_active_conversation_id";

function memoryStorageKey(conversationId: number): string {
  return `${LEGAL_CHAT_MEMORY_KEY}_${conversationId}`;
}

function persistMemory(conversationId: number, memory: ConversationMemory): void {
  localStorage.setItem(memoryStorageKey(conversationId), JSON.stringify(memory));
}

export const listConversations = async (): Promise<ConversationSummary[]> => {
  const response = await apiClient.get("/api/conversations/");
  return response.data;
};

import type { ResearchMode } from "@/constants/researchModes";

export const createConversation = async (
  researchMode: ResearchMode = "standard"
): Promise<{
  conversation_id: number;
  title: string;
  created_at: string;
  research_mode?: string;
}> => {
  const response = await apiClient.post("/api/conversations/", {
    title: "New research",
    research_mode: researchMode,
  });
  return response.data;
};

export const deleteConversation = async (conversationId: number): Promise<void> => {
  await apiClient.delete(`/api/conversations/${conversationId}/`);
  localStorage.removeItem(memoryStorageKey(conversationId));
};

export const sendChatMessage = async (
  conversationId: number,
  message: string,
  options?: { deepResearch?: boolean; includeSources?: boolean }
): Promise<SendChatMessageResult> => {
  if (!message.trim()) throw new Error("Message is required.");

  const token = getAuthToken();
  if (!token) throw new Error("Not signed in. Please log in again.");

  const payload: Record<string, unknown> = { message };
  payload.deep_research = Boolean(options?.deepResearch);
  if (options?.includeSources) payload.include_sources = true;

  const response = await apiClient.post(`/api/conversations/${conversationId}/chat/`, payload);
  const data = response.data;

  if (data.memory) {
    persistMemory(conversationId, data.memory);
  }

  return {
    message: data.message,
    conversationId: data.conversation_id,
    conversationTitle: data.conversation_title,
    sources: data.sources ?? data.message?.sources ?? [],
    external_references:
      data.external_references ?? data.message?.external_references ?? [],
    rag_used: data.rag_used ?? data.message?.rag_used ?? false,
    structured: data.structured ?? data.message?.structured,
    intent: data.intent ?? data.message?.intent,
    confidence: data.confidence ?? data.message?.confidence,
    memory: data.memory,
  };
};

export const getConversation = async (
  conversationId: number
): Promise<{
  conversation_id: number;
  title: string;
  memory?: ConversationMemory;
  research_mode?: string;
  messages: Array<{
    id?: number;
    role: "human" | "ai";
    content: string;
    created_at: string;
    sources?: ChatSource[];
    external_references?: ChatSource[];
    rag_used?: boolean;
    structured?: ChatStructuredResponse;
    intent?: string;
    confidence?: number;
  }>;
}> => {
  const response = await apiClient.get(`/api/conversations/${conversationId}/`);
  if (response.data.memory) {
    persistMemory(conversationId, response.data.memory);
  }
  return response.data;
};

export const exportConversationReport = async (conversationId: number) => {
  const response = await apiClient.get(`/api/conversations/${conversationId}/export/`);
  return response.data;
};
