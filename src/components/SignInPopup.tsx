import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleLogin } from '@/api/google_login';
import { setAuthToken } from '@/api';

interface SignInPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

const SignInPopup = ({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onForgotPassword,
}: SignInPopupProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

const googleLogin = useGoogleLogin({
  flow: "auth-code",
  redirect_uri: window.location.origin,
  onSuccess: async (codeResponse) => {
    console.log("🔵 Frontend (SignInPopup) - Google OAuth Success:", codeResponse);
    console.log("🔵 Frontend (SignInPopup) - Redirect URI:", window.location.origin);
    
    setIsLoading(true);
    try {
      const res = await GoogleLogin(codeResponse.code);
      console.log("🔵 Frontend (SignInPopup) - Backend response:", res.data);
      
      const token = res.data.key;
      
      // Store token using the same method as regular login
      setAuthToken(token);
      localStorage.setItem('isAuthenticated', 'true');
      
      console.log("🔵 Frontend (SignInPopup) - Token stored as authToken:", localStorage.getItem("authToken"));
      console.log("🔵 Frontend (SignInPopup) - isAuthenticated set to:", localStorage.getItem("isAuthenticated"));
      
      toast({ title: 'Success!', description: 'Logged in with Google' });
      onClose();
    } catch (err: any) {
      console.error("🔴 Frontend (SignInPopup) - Google Login Error:", err);
      console.error("🔴 Frontend (SignInPopup) - Error Response:", err.response?.data);
      toast({ title: 'Login Failed', description: err.response?.data?.non_field_errors?.[0] || 'Google login failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  },
  onError: (error) => {
    console.error("🔴 Frontend (SignInPopup) - Google OAuth Error:", error);
    toast({ title: 'Error', description: 'Google authentication failed', variant: 'destructive' });
  },
});


  const handleContinue = () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Coming soon',
      description: 'Email login not implemented yet',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="relative p-6 pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-semibold text-center mt-2">Welcome Back</h2>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => googleLogin()}
              disabled={isLoading}
            >
              <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                G
              </div>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>
          </div>

          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">OR</span>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90"
              onClick={handleContinue}
              disabled={isLoading}
            >
              Continue
            </Button>
          </div>

          <div className="text-center pt-4 text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Button variant="link" className="p-0 h-auto text-primary" onClick={onSwitchToSignUp}>
              Sign up
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInPopup;