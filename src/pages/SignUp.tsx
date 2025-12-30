import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerUser, clearAuthToken } from '@/api';
import GoogleLoginButton from '@/components/GoogleLoginButton';

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

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
      clearAuthToken();
      await registerUser({ email: formData.email, password: formData.password });
      toast({
        title: "Account Created!",
        description: "Welcome to LegalAI Pro",
      });
      navigate('/signin');
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">

      {/* Main Content Area */}
      <div className="flex-1 flex items-start justify-center px-6 md:px-8 lg:px-12 pt-20 pb-12">
        <div className="w-full max-w-[520px] space-y-8">

          {/* Sign Up Card */}
          <Card className="border-border shadow-lg">
            {/* Logo + Subtitle Centered */}
            <CardHeader className="px-6 pt-12 pb-10">
              <div className="flex justify-center">
                <img
                  src="/logo.svg"
                  alt="LexOrbit Logo"
                  className="h-20 md:h-24 lg:h-28 object-contain"
                />
              </div>
              {/* Commented out Create Account title as per design */}
              {/* <CardTitle className="text-3xl font-bold">Create Account</CardTitle> */}
              
              {/* Centered subtitle */}
              <p className="text-center text-base text-muted-foreground mt-8">
              Join thousands of legal professionals
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            {/* Social Sign Up Buttons */}
            <div className="space-y-3 mb-6">
              <GoogleLoginButton 
                onSuccess={(token) => {
                  toast({
                    title: "Google Sign Up Successful",
                    description: "Your account is created with Google",
                  });
                  navigate("/dashboard");
                }}
                onError={(err) => {
                  toast({
                    title: "Google Sign Up Failed",
                    description: "Something went wrong, please try again.",
                    variant: "destructive",
                  });
                  console.error(err);
                }}
              />

              <Button
                variant="outline"
                className="w-full h-11 justify-start gap-3 text-sm font-medium"
                onClick={() => toast({ title: "Apple Sign Up", description: "TODO: implement Apple login" })}
                disabled={isLoading}
              >
                <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs">
                  🍎
                </div>
                Continue with Apple
              </Button>

              <Button
                variant="outline"
                className="w-full h-11 justify-start gap-3 text-sm font-medium"
                onClick={() => toast({ title: "Microsoft Sign Up", description: "TODO: implement Microsoft login" })}
                disabled={isLoading}
              >
                <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                  M
                </div>
                Continue with Microsoft
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground">OR</span>
              </div>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => updateFormData('agreeToTerms', checked as boolean)}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-5 cursor-pointer">
                  I agree to the{' '}
                  <Button variant="link" className="p-0 h-auto text-primary text-sm hover:underline" type="button">
                    Terms of Service
                  </Button>
                  {' '}and{' '}
                  <Button variant="link" className="p-0 h-auto text-primary text-sm hover:underline" type="button">
                    Privacy Policy
                  </Button>
                </label>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-medium mt-6" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="text-center pt-6 border-t mt-6">
              <span className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary font-semibold hover:underline"
                  onClick={() => navigate('/signin')}
                >
                  Sign in
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>

          {/* -------- Back Button – exactly center bottom of the card -------- */}
          <div className="flex justify-center">
            <Button variant="ghost" className="gap-2" onClick={() => navigate('/signin')}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>

          {/* -------- Footer -------- */}
          <div className="mt-10 text-center text-xs text-muted-foreground">
            This project is developed by{" "}
            <a
              href="https://getlexorbit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              LexOrbit.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;