// api/google_login.ts
import { apiClient } from "./config";

interface GoogleLoginPayload {
  code: string;  // Only code, no optional id_token
}

interface GoogleLoginResponse {
  key: string;
}

export const GoogleLogin = (code: string) => {
  const payload = {
    code,
    redirect_uri: window.location.origin,
  };
  
  console.log("🔵 Frontend (API) - GoogleLogin payload:", JSON.stringify(payload, null, 2));
  
  return apiClient.post<GoogleLoginResponse>(
    "accounts/dj-rest-auth/google/login/",
    payload,  // ← Send both code and redirect_uri
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};