import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loginUser } from '@/api/api';
import GoogleLoginButton from '@/components/GoogleLoginButton';  

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Actual login API call
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      // check response for token
      const token = response.data?.token || response.data?.access;
      if (token) {
        localStorage.setItem("authToken", token);
        toast({
          title: "Welcome Back!",
          description: "Successfully signed in to your account",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid server response",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.detail || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[480px] mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card className="border-border">
          <CardHeader className="text-center space-y-2 px-6 pt-8 pb-6">
            <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              {/* ✅ Replaced old Google button with real GoogleLoginButton */}
              <GoogleLoginButton 
                onSuccess={(token) => {
                  toast({
                    title: "Google Login Successful",
                    description: "You are now signed in with Google",
                  });
                  navigate("/dashboard");
                }}
                onError={(err) => {
                  toast({
                    title: "Google Login Failed",
                    description: "Something went wrong, please try again.",
                    variant: "destructive",
                  });
                  console.error(err);
                }}
              />

              {/* Apple Button (UI unchanged) */}
              <Button
                variant="outline"
                className="w-full h-11 justify-start gap-3 text-sm font-medium"
                onClick={() => toast({ title: "Apple Sign In", description: "TODO: implement Apple login" })}
                disabled={isLoading}
              >
                <div className="w-5 h-5 bg-black rounded flex items-center justify-center text-white text-xs">
                  🍎
                </div>
                Continue with Apple
              </Button>

              {/* Microsoft Button (UI unchanged) */}
              <Button
                variant="outline"
                className="w-full h-11 justify-start gap-3 text-sm font-medium"
                onClick={() => toast({ title: "Microsoft Sign In", description: "TODO: implement Microsoft login" })}
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

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-5">
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
                    placeholder="Enter your password"
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => updateFormData('rememberMe', e.target.checked)}
                    className="w-4 h-4 rounded border-input cursor-pointer"
                  />
                  <span className="text-sm text-foreground">Remember me</span>
                </label>
                
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm text-primary hover:underline"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </Button>
              </div>

              <Button 
                type="submit"
                className="w-full h-11 text-base font-medium mt-6" 
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-6 border-t mt-6">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary font-semibold hover:underline"
                  onClick={() => navigate('/signup')}
                >
                  Sign up
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
