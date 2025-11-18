// api/google_login.ts
import { apiClient } from "./config";

interface GoogleLoginPayload {
  code: string;  // Only code, no optional id_token
}

interface GoogleLoginResponse {
  key: string;
}

export const GoogleLogin = (code: string) => {
  return apiClient.post<GoogleLoginResponse>(
    "accounts/dj-rest-auth/google/login/",
    { code },  // ← dj-rest-auth expects exactly { "code": "..." }
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};