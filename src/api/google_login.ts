import { apiClient } from "./config";

interface GoogleLoginPayload {
  access_token: string;
}

interface GoogleLoginResponse {
  key: string;
}

export const GoogleLogin = (accessToken: string) => {
  const payload = {
    access_token: accessToken,
  };
  
  console.log("🔵 Frontend (API) - GoogleLogin payload:", JSON.stringify(payload, null, 2));
  
  return apiClient.post<GoogleLoginResponse>(
    "accounts/dj-rest-auth/google/login/",
    payload,
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};