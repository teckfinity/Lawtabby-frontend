import axios from "axios";
import { emitUpgradeRequired } from "./upgradeRequired";

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
    // List of endpoints that should NOT include the auth token
    const publicEndpoints = [
      '/accounts/register/',
      '/accounts/login/',
      '/accounts/password_reset/',
    ];

    const isPublic = publicEndpoints.some(endpoint => 
      config.url?.endsWith(endpoint)
    );

    if (!isPublic) {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Token ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    if (error.response?.status === 402 && data?.upgrade_required) {
      emitUpgradeRequired({
        feature_key: data.feature_key,
        used: data.used,
        limit: data.limit,
        message: data.message || data.error,
        error: data.error,
      });
    }
    return Promise.reject(error);
  }
);
