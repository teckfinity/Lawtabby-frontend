import { apiClient } from "./config";


export const sendLegalChat = (message: string, file?: File) => {
  if (!message) throw new Error("Message is required.");

  const formData = new FormData();
  formData.append("message", message);

  if (file) {
    formData.append("file", file, file.name);
  }

  return apiClient.post("/api/legal/ai/chat/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};