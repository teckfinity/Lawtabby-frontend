// src/api/password.ts
import { apiClient } from "./config";

interface ValidateTokenPayload {
  token: string;
}

interface ConfirmPasswordPayload {
  password: string;
  token: string;
}

// Validate token API
export const ValidateToken = (data: ValidateTokenPayload) => {
  const { token } = data;

  if (!token) {
    throw new Error("Token is required.");
  }

  return apiClient.post("/accounts/password_reset/validate_token/", data, {
    headers: { "Content-Type": "application/json" },
  });
};

// Confirm reset password API
export const ConfirmPassword = (data: ConfirmPasswordPayload) => {
  const { password, token } = data;

  if (!password || !token) {
    throw new Error("Both password and token are required.");
  }

  return apiClient.post("/accounts/password_reset/confirm/", data, {
    headers: { "Content-Type": "application/json" },
  });
};
