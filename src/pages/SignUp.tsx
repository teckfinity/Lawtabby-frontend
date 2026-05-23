import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { registerUser, clearAuthToken } from "@/api";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { AuthOAuthStack } from "@/components/auth/AuthOAuthStack";
import { authInputClassName, authLabelClassName } from "@/components/auth/authFormClasses";
import { cn } from "@/lib/utils";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
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
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      clearAuthToken();
      await registerUser({ email: formData.email, password: formData.password });
      toast({
        title: "Account Created!",
        description: "Welcome to LexOrbit",
      });
      navigate("/signin");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: "Registration Failed",
        description: err.response?.data?.message || err.message || "Something went wrong",
        variant: "destructive",
      });
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
        <div className="w-full max-w-[480px] space-y-8">
          <Card className="rounded-lg border border-white/[0.09] bg-[#161d2b] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)]">
            <CardHeader className="space-y-0 px-8 pb-2 pt-10">
              <div className="flex justify-center">
                <img src="/logo.svg" alt="LexOrbit" className="h-[4.5rem] w-auto object-contain md:h-24" />
              </div>
              <p className="mt-8 text-center text-[15px] leading-relaxed text-[#94a3b8]">
                Join thousands of legal professionals
              </p>
            </CardHeader>

            <CardContent className="px-8 pb-10 pt-2">
              <AuthOAuthStack
                isLoading={isLoading}
                onApple={() => toast({ title: "Apple Sign Up", description: "TODO: implement Apple login" })}
                onMicrosoft={() => toast({ title: "Microsoft Sign Up", description: "TODO: implement Microsoft login" })}
                googleSlot={
                  <GoogleLoginButton
                    onSuccess={() => {
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
                }
              />

              <div className="relative py-7">
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" aria-hidden />
                <p className="relative mx-auto w-fit bg-[#161d2b] px-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
                  or
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-5">
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
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => updateFormData("password", e.target.value)}
                      className={cn(authInputClassName, "pr-11")}
                      autoComplete="new-password"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={authLabelClassName}>
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                      className={cn(authInputClassName, "pr-11")}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0.5 top-1/2 h-10 w-10 -translate-y-1/2 text-white/45 hover:bg-transparent hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => updateFormData("agreeToTerms", checked as boolean)}
                    className="mt-0.5 border-white/25 bg-[#2d3748] data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                  />
                  <label htmlFor="terms" className="cursor-pointer text-sm leading-5 text-[#cbd5e1]">
                    I agree to the{" "}
                    <Button variant="link" className="h-auto p-0 text-sm text-primary hover:text-gold-light" type="button">
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button variant="link" className="h-auto p-0 text-sm text-primary hover:text-gold-light" type="button">
                      Privacy Policy
                    </Button>
                  </label>
                </div>

                <Button type="submit" className="mt-6 h-11 w-full text-base font-semibold" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <span className="text-sm text-[#94a3b8]">
                  Already have an account?{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm font-semibold text-primary hover:text-gold-light"
                    onClick={() => navigate("/signin")}
                  >
                    Sign in
                  </Button>
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="gap-2 text-[#94a3b8] hover:bg-white/5 hover:text-white"
              onClick={() => navigate("/signin")}
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

export default SignUp;
