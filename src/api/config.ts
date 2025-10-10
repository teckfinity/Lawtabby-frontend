import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ---------- TOKEN HANDLER ----------
export const getAuthToken = () => localStorage.getItem("authToken");
export const setAuthToken = (token: string) => localStorage.setItem("authToken", token);
export const clearAuthToken = () => localStorage.removeItem("authToken");

// ---------- AXIOS INSTANCE ----------
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Token ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
