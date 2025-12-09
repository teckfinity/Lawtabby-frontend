import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { API_BASE_URL, setAuthToken } from "@/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";   // 👈 use shadcn Button

interface GoogleLoginButtonProps {
  onSuccess?: (token: string) => void;
  onError?: (err: any) => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("🔵 Frontend - Google OAuth Success - Token Response:", tokenResponse);
      console.log("🔵 Frontend - Access Token:", tokenResponse.access_token);
      
      const payload = {
        access_token: tokenResponse.access_token,
      };
      
      console.log("🔵 Frontend - Payload being sent to backend:", JSON.stringify(payload, null, 2));
      console.log("🔵 Frontend - Backend URL:", `${API_BASE_URL}/accounts/dj-rest-auth/google/login/`);
      
      try {
        const res = await axios.post(`${API_BASE_URL}/accounts/dj-rest-auth/google/login/`, payload);
        console.log("🔵 Frontend - Backend response:", res.data);
        
        const token = res.data.key;
        
        // Store token using the same method as regular login
        setAuthToken(token);
        localStorage.setItem("isAuthenticated", "true");
        
        console.log("🔵 Frontend - Token stored as authToken:", localStorage.getItem("authToken"));
        console.log("🔵 Frontend - isAuthenticated set to:", localStorage.getItem("isAuthenticated"));

        if (onSuccess) {
          onSuccess(token);
          // Don't navigate here - let the parent component handle navigation
          // navigate("/dashboard");
        }
      } catch (err: any) {
        console.error("🔴 Frontend - Google OAuth Error:", err);
        console.error("🔴 Frontend - Error Response:", err.response?.data);
        console.error("🔴 Frontend - Error Status:", err.response?.status);
        if (onError) onError(err);
      }
    },
    onError: (err) => {
      console.error("🔴 Frontend - Google Login Error:", err);
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
