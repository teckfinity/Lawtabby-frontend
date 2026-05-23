import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from "@/api";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { AuthOAuthStack } from "@/components/auth/AuthOAuthStack";
import { authInputClassName, authLabelClassName } from "@/components/auth/authFormClasses";
import { cn } from "@/lib/utils";

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      });

      const token = response.data?.token || response.data?.access;
      if (token) {
        localStorage.setItem("authToken", token);

        localStorage.setItem("isAuthenticated", "true");

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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Login Failed",
        description: err.response?.data?.detail || "Invalid email or password",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen w-full bg-[#121926] font-body text-foreground">
      <div className="flex min-h-screen flex-1 flex-col items-center px-6 pb-16 pt-14 md:px-8 md:pt-20">
        <div className="w-full max-w-[440px] space-y-8">
          <Card className="rounded-lg border border-white/[0.09] bg-[#161d2b] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]">
            <CardHeader className="space-y-0 px-8 pb-2 pt-10">
              <div className="flex justify-center">
                <img src="/logo.svg" alt="LexOrbit" className="h-[4.5rem] w-auto object-contain md:h-24" />
              </div>
              <p className="mt-8 text-center text-[15px] leading-relaxed text-[#94a3b8]">
                Sign in to your account to continue
              </p>
            </CardHeader>

            <CardContent className="px-8 pb-10 pt-2">
              <AuthOAuthStack
                isLoading={isLoading}
                onApple={() => toast({ title: "Apple Sign In", description: "TODO: implement Apple login" })}
                onMicrosoft={() => toast({ title: "Microsoft Sign In", description: "TODO: implement Microsoft login" })}
                googleSlot={
                  <GoogleLoginButton
                    onSuccess={() => {
                      toast({
                        title: "Google Login Successful",
                        description: "You are now signed in with Google",
                      });
                      localStorage.setItem("isAuthenticated", "true");
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
                }
              />

              <div className="relative py-7">
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" aria-hidden />
                <p className="relative mx-auto w-fit bg-[#161d2b] px-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
                  or
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className={authLabelClassName}>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    className={cn(authInputClassName)}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className={authLabelClassName}>
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      className={cn(authInputClassName, "pr-11")}
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0.5 top-1/2 h-10 w-10 -translate-y-1/2 text-white/45 hover:bg-transparent hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#cbd5e1]">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => updateFormData("rememberMe", e.target.checked)}
                      className="h-4 w-4 rounded border border-white/25 bg-[#2d3748] text-primary accent-primary focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:ring-offset-transparent"
                    />
                    Remember me
                  </label>

                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm font-medium text-primary hover:text-gold-light"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button type="submit" className="mt-6 h-11 w-full text-base font-semibold" disabled={isLoading}>
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <span className="text-sm text-[#94a3b8]">
                  Don&apos;t have an account?{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm font-semibold text-primary hover:text-gold-light"
                    onClick={() => navigate("/signup")}
                  >
                    Sign up
                  </Button>
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="gap-2 text-[#94a3b8] hover:bg-white/5 hover:text-white"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <p className="text-center text-xs text-[#64748b]">
            This project is developed by{" "}
            <a
              href="https://getlexorbit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/90 underline-offset-2 hover:text-primary hover:underline"
            >
              LexOrbit.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
