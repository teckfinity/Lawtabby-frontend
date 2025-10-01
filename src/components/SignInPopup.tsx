import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignInPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

const SignInPopup = ({ isOpen, onClose, onSwitchToSignUp, onForgotPassword }: SignInPopupProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSocialSignIn = (provider: string) => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sign In Simulation",
        description: `Would sign in with ${provider}`,
      });
    }, 1000);
  };

  const handleContinue = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sign In Simulation",
        description: `Would continue with ${email}`,
      });
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
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
          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => handleSocialSignIn('Google')}
              disabled={isLoading}
            >
              <div className="w-5 h-5 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">
                G
              </div>
              Continue with Google
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={() => handleSocialSignIn('Apple')}
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
              onClick={() => handleSocialSignIn('Microsoft')}
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

          {/* Email Input */}
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
              {isLoading ? "Loading..." : "Continue"}
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-4">
            <span className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Button
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={onSwitchToSignUp}
              >
                Sign up
              </Button>
            </span>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Button
              variant="link"
              className="p-0 h-auto text-sm text-muted-foreground"
              onClick={onForgotPassword}
            >
              Forgot your password?
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInPopup;