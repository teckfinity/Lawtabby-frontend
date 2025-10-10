// src/components/auth/AppleLoginButton.tsx
import React from "react";
import AppleSignin, { AppleAuthResponse } from "react-apple-signin-auth";
import axios from "axios";
import { API_BASE_URL } from "@/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";   // ✅ use shadcn Button

interface AppleLoginButtonProps {
  onSuccess?: (token: string) => void;
  onError?: (err: any) => void;
}

const AppleLoginButton: React.FC<AppleLoginButtonProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();

  const handleSignInSuccess = async (response: AppleAuthResponse) => {
    try {
      console.log("Apple Sign-in successful:", response);

      const code = response.authorization?.code;
      const idToken = response.authorization?.id_token;

      if (!code || !idToken) {
        console.error("Missing authorization code or id_token");
        return;
      }

      // Exchange authorization code with backend for tokens
      const res = await axios.post(`${API_BASE_URL}/accounts/dj-rest-auth/apple/login/`, {
        code,
        id_token: idToken,
      });

      const token: string = res.data.key;
      localStorage.setItem("token", token);

      if (onSuccess) onSuccess(token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error exchanging Apple code for tokens:", err);
      if (onError) onError(err);
    }
  };

  const handleSignInError = (err: any) => {
    console.error("Apple sign-in error:", err);
    if (onError) onError(err);
  };

  return (
    <AppleSignin
      authOptions={{
        clientId: "com.lawtabby.pdf.sid", // Replace with your actual client ID
        scope: "email name",
        redirectURI: "https://ai-lawyer.neuracase.com",
        state: "state",
        nonce: "nonce",
        usePopup: true,
      }}
      onSuccess={handleSignInSuccess}
      onError={handleSignInError}
      render={(props: any) => (
        <Button
          variant="outline"
          className="w-full h-11 justify-start gap-3 text-sm font-medium"
          onClick={props.onClick}
        >
          <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs">
            🍎
          </div>
          Continue with Apple
        </Button>
      )}
    />
  );
};

export default AppleLoginButton;
