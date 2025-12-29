import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RequestPasswordReset } from '@/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSendResetEmail = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    RequestPasswordReset({ email })
      .then(() => {
        setIsLoading(false);
        setEmailSent(true);
        toast({
          title: "Reset Link Sent",
          description: `Check your inbox for password reset instructions at ${email}`,
        });
      })
      .catch(() => {
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to send reset link. Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleResendEmail = () => {
    setIsLoading(true);

    RequestPasswordReset({ email })
      .then(() => {
        setIsLoading(false);
        toast({
          title: "Email Resent",
          description: `Password reset email has been sent again to ${email}`,
        });
      })
      .catch(() => {
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to resend reset email. Please try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* -------- Fixed Logo at Top-Left -------- */}
      <div className="fixed top-0 left-0 z-50 px-6 md:px-8 lg:px-12 pt-8 pb-8 bg-background">
        <img
          src="/logo.svg"
          alt="LexOrbit Logo"
          className="h-20 md:h-24 lg:h-28 object-contain"
        />
      </div>

      {/* -------- Main Content Area – perfect vertical center (jaise pehle tha) -------- */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-8 lg:px-12 pb-12">
        <div className="w-full max-w-md space-y-8">
          {/* -------- Forgot Password Card -------- */}
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {emailSent ? (
                  <CheckCircle className="w-6 h-6 text-primary" />
                ) : (
                  <Mail className="w-6 h-6 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {emailSent ? 'Check Your Email' : 'Forgot Password?'}
              </CardTitle>
              <CardDescription>
                {emailSent 
                  ? `We've sent a password reset link to ${email}` 
                  : 'Enter your email address and we\'ll send you a link to reset your password'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!emailSent ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <Button 
                    className="w-full h-12" 
                    onClick={handleSendResetEmail}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Didn't receive the email? Check your spam folder or</p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-12" 
                    onClick={handleResendEmail}
                    disabled={isLoading}
                  >
                    {isLoading ? "Resending..." : "Resend Email"}
                  </Button>

                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                    }}
                  >
                    Try Different Email
                  </Button>
                </div>
              )}

              {/* Help Section */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  Still having trouble? {' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary text-sm"
                    onClick={() => navigate('/contact-support')}
                  >
                    Contact Support
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* -------- Back Button – exactly center bottom of the card -------- */}
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              className="gap-2"
              onClick={() => navigate('/signin')}
            >
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

export default ForgotPassword;