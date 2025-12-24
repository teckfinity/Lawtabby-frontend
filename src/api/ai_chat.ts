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
  message: string
): Promise<{ id: number; role: "ai"; content: string; created_at: string }> => {
  if (!message.trim()) throw new Error("Message is required.");

  const response = await apiClient.post(`/api/conversations/${conversationId}/chat/`, {
    message,
  });
  return response.data.message;
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
  }>;
}> => {
  const response = await apiClient.get(`/api/conversations/${conversationId}/`);
  return response.data;
};