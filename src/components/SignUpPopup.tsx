import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SignUpPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignIn: () => void;
}

const SignUpPopup = ({ isOpen, onClose, onSwitchToSignIn }: SignUpPopupProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSocialSignUp = (provider: string) => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sign Up Simulation",
        description: `Would sign up with ${provider}`,
      });
    }, 1000);
  };

  const handleSignUp = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
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
    
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sign Up Simulation",
        description: `Would create account for ${formData.email}`,
      });
    }, 1000);
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
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
              onClick={() => handleSocialSignUp('Google')}
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
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => updateFormData('firstName', e.target.value)}
                className="h-12"
              />
              <Input
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => updateFormData('lastName', e.target.value)}
                className="h-12"
              />
            </div>

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