// src/api/ai_chat.ts
import { apiClient } from "./config";

// Optional: If your token is stored in localStorage or a context
const getAuthToken = () => {
  return localStorage.getItem("auth_token") || ""; // Change this to your actual token storage method
};

// Add interceptor once to automatically attach token to ALL requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export type ChatSource = {
  title: string;
  court?: string;
  author?: string;
  date?: string;
  url?: string;
  excerpt?: string;
  description?: string;
  source_type: "case_law" | "external_reference";
};

export type ChatMessageResponse = {
  id: number;
  role: "ai";
  content: string;
  created_at: string;
  sources?: ChatSource[];
  external_references?: ChatSource[];
  rag_used?: boolean;
};

export type SendChatMessageResult = {
  message: ChatMessageResponse;
  sources: ChatSource[];
  external_references: ChatSource[];
  rag_used: boolean;
};

// 1. Create new conversation
export const createConversation = async (): Promise<{ conversation_id: number; title: string; created_at: string }> => {
  const response = await apiClient.post("/api/conversations/", {
    title: "Legal AI Chat",
  });
  return response.data;
};

// 2. Send message in a conversation
export const sendChatMessage = async (
  conversationId: number,
  message: string,
  options?: { useRag?: boolean }
): Promise<SendChatMessageResult> => {
  if (!message.trim()) throw new Error("Message is required.");

  const payload: { message: string; use_rag?: boolean } = { message };
  if (options?.useRag !== undefined) {
    payload.use_rag = options.useRag;
  }

  const response = await apiClient.post(`/api/conversations/${conversationId}/chat/`, payload);
  return {
    message: response.data.message,
    sources: response.data.sources ?? response.data.message?.sources ?? [],
    external_references:
      response.data.external_references ?? response.data.message?.external_references ?? [],
    rag_used: response.data.rag_used ?? response.data.message?.rag_used ?? false,
  };
};

// 3. Get full conversation details (history)
export const getConversation = async (
  conversationId: number
): Promise<{
  conversation_id: number;
  title: string;
  messages: Array<{
    id?: number;
    role: "human" | "ai";
    content: string;
    created_at: string;
    sources?: ChatSource[];
    external_references?: ChatSource[];
    rag_used?: boolean;
  }>;
}> => {
  const response = await apiClient.get(`/api/conversations/${conversationId}/`);
  return response.data;
};
