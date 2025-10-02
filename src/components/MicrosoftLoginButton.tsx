// src/components/auth/MicrosoftLoginButton.tsx
import React from "react";
import MicrosoftLogin from "react-microsoft-login";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/api/api";
import { Button } from "@/components/ui/button";   

interface MicrosoftLoginResponse {
  accessToken?: string;
  idToken?: string;
  account?: any;
}

const MicrosoftLoginButton: React.FC = () => {
  const navigate = useNavigate();

  const clientId: string =
    process.env.REACT_APP_MICROSOFT_CLIENT_ID ||
    "7ef6bc24-cbd7-4e47-b874-e9c417da13d6";
  const redirectUri: string = "https://ai-lawyer.neuracase.com";

  const loginHandler = async (err: any, response?: MicrosoftLoginResponse) => {
    if (err) {
      console.error("Login Error:", err);
      return;
    }

    if (response?.accessToken && response?.idToken) {
      try {
        const tokensResponse = await axios.post(
          `${API_BASE_URL}/accounts/dj-rest-auth/microsoft/login/`,
          {
            access_token: response.accessToken,
            id_token: response.idToken,
          }
        );

        const token = tokensResponse.data.key;
        localStorage.setItem("token", token);
        navigate("/dashboard");
      } catch (apiError) {
        console.error("Error exchanging tokens:", apiError);
      }
    }
  };

  return (
    <MicrosoftLogin clientId={clientId} authCallback={loginHandler} redirectUri={redirectUri}>
      {({ onClick }: { onClick: () => void }) => (
        <Button
          variant="outline"
          className="w-full h-11 justify-start gap-3 text-sm font-medium"
          onClick={onClick}
        >
          <div className="w-5 h-5 bg-blue-500 text-white flex items-center justify-center rounded text-xs font-bold">
            M
          </div>
          Continue with Microsoft
        </Button>
      )}
    </MicrosoftLogin>
  );
};

export default MicrosoftLoginButton;
