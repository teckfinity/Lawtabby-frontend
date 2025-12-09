import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerUser } from '@/api';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleLogin } from '@/api/google_login';
import { setAuthToken } from '@/api';

interface SignUpPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
}

const SignUpPopup = ({ isOpen, onClose, onSwitchToSignIn }: SignUpPopupProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Google login
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("🔵 Frontend (SignInPopup) - Google OAuth Success:", tokenResponse);
      console.log("🔵 Frontend (SignInPopup) - Access Token:", tokenResponse.access_token);
      
      setIsLoading(true);
      try {
        const res = await GoogleLogin(tokenResponse.access_token);
        console.log("🔵 Frontend (SignUpPopup) - Backend response:", res.data);
        
        const token = res.data.key;

        // Store token
        setAuthToken(token);
        localStorage.setItem('isAuthenticated', 'true');

        console.log("🔵 Frontend (SignUpPopup) - Token stored as authToken:", localStorage.getItem("authToken"));
        console.log("🔵 Frontend (SignUpPopup) - isAuthenticated set to:", localStorage.getItem("isAuthenticated"));

        toast({ title: 'Success!', description: 'Logged in with Google' });
        onClose();
      } catch (err: any) {
        console.error("🔴 Frontend (SignUpPopup) - Google Login Error:", err);
        console.error("🔴 Frontend (SignUpPopup) - Error Response:", err.response?.data);
        toast({
          title: 'Login Failed',
          description: err.response?.data?.non_field_errors?.[0] || 'Google login failed',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("🔴 Frontend (SignUpPopup) - Google OAuth Error:", error);
      toast({ title: 'Error', description: 'Google authentication failed', variant: 'destructive' });
    },
  });

  const handleSignUp = async () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await registerUser({ email: formData.email, password: formData.password });
      toast({
        title: "Account Created!",
        description: `Welcome to LegalAI Pro`,
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Placeholder for Apple & Microsoft buttons
  const handleSocialSignUp = (provider: string) => {
    toast({ title: `${provider} login not implemented yet` });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative p-6 pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-semibold text-center mt-2">Create Account</h2>
          <p className="text-sm text-muted-foreground text-center">
            Join thousands of legal professionals
          </p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Social Login Buttons */}
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

            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => handleSocialSignUp('Apple')}
              disabled={isLoading}
            >
              <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs font-bold">
                🍎
              </div>
              Continue with Apple
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => handleSocialSignUp('Microsoft')}
              disabled={isLoading}
            >
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                M
              </div>
              Continue with Microsoft Account
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              className="h-12"
            />

            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => updateFormData('password', e.target.value)}
              className="h-12"
            />

            <Input
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData('confirmPassword', e.target.value)}
              className="h-12"
            />

            {/* Terms Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => updateFormData('agreeToTerms', checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-4">
                I agree to the{' '}
                <Button variant="link" className="p-0 h-auto text-primary text-sm">
                  Terms of Service
                </Button>
                {' '}and{' '}
                <Button variant="link" className="p-0 h-auto text-primary text-sm">
                  Privacy Policy
                </Button>
              </label>
            </div>

            <Button
              className="w-full h-12 bg-primary hover:bg-primary/90"
              onClick={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>

          {/* Sign In Link */}
          <div className="text-center pt-4">
            <span className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={onSwitchToSignIn}
              >
                Sign in
              </Button>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpPopup;
