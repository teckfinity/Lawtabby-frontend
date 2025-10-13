import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { API_BASE_URL } from "@/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";   // 👈 use shadcn Button

interface GoogleLoginButtonProps {
  onSuccess?: (token: string) => void;
  onError?: (err: any) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        const res = await axios.post(`${API_BASE_URL}/accounts/dj-rest-auth/google/login/`, {
          code: codeResponse.code,
        });
        const token = res.data.key;
        localStorage.setItem("token", token);

        if (onSuccess) onSuccess(token);
        navigate("/dashboard");
      } catch (err) {
        if (onError) onError(err);
      }
    },
    onError: (err) => {
      if (onError) onError(err);
    },
  });

  return (
    <Button
      variant="outline"
      className="w-full h-11 justify-start gap-3 text-sm font-medium"
      onClick={() => googleLogin()}
    >
      <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
        G
      </div>
      Continue with Google
    </Button>
  );
};

export default GoogleLoginButton;
