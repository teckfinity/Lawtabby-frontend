/**
 * ai-features/client.ts
 * ─────────────────────
 * Shared Axios instance for all AI feature APIs.
 * Token is auto-attached from localStorage via interceptor.
 */
import axios from "axios";

export const AI_API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const getAuthToken = () => localStorage.getItem("authToken");

export const aiClient = axios.create({ baseURL: AI_API_BASE });

aiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Token ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
