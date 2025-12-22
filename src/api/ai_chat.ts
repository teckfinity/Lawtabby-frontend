// src/api/ai_chat.ts
import { apiClient } from "./config";

export const sendLegalChat = (
  message: string,
  file?: File,
  sessionId?: string  // ← NEW: optional session ID
) => {
  if (!message) throw new Error("Message is required.");

  const formData = new FormData();
  formData.append("message", message);

  if (file) {
    formData.append("file", file, file.name);
  }

  // Add session ID if provided
  if (sessionId) {
    formData.append("session_id", sessionId);
  }

  return apiClient.post("/api/legal/ai/chat/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};