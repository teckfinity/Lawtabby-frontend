import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { API_BASE_URL, setAuthToken } from "@/api";
import { cn } from "@/lib/utils";
import {
  oauthStandardButtonClass,
  oauthStandardLabelClass,
  oauthIconColumnClass,
} from "@/components/auth/oauthStandardStyles";
import { GoogleGIcon } from "@/components/auth/OAuthBrandIcons";

interface GoogleLoginButtonProps {
  onSuccess?: (token: string) => void;
  onError?: (err: unknown) => void;
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError, className }) => {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const payload = {
        access_token: tokenResponse.access_token,
      };

      try {
        const res = await axios.post(`${API_BASE_URL}/accounts/dj-rest-auth/google/login/`, payload);

        const token = res.data.key;

        setAuthToken(token);
        localStorage.setItem("isAuthenticated", "true");

        if (onSuccess) {
          onSuccess(token);
        }
      } catch (err: unknown) {
        console.error("Google OAuth Error:", err);
        if (onError) onError(err);
      }
    },
    onError: (err) => {
      console.error("Google Login Error:", err);
      if (onError) onError(err);
    },
  });

  return (
    <button
      type="button"
      className={cn(oauthStandardButtonClass, className)}
      onClick={() => googleLogin()}
    >
      <span className={oauthIconColumnClass} aria-hidden>
        <GoogleGIcon />
      </span>
      <span className={oauthStandardLabelClass}>Continue with Google</span>
    </button>
  );
};

export default GoogleLoginButton;
