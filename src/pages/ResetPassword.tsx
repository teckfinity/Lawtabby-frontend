import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ValidateToken, ConfirmPassword } from '@/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState(false);

  const [searchParams] = useSearchParams();

  // Validate token on component mount
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      toast({
        title: "Invalid Link",
        description: "No token found in URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    ValidateToken({ token: tokenFromUrl }) // Direct Axios function call
      .then((res) => {
        setIsLoading(false);
        if (res.data.valid) { // Adjust based on your API response
          setToken(tokenFromUrl);
          setIsTokenValid(true);
        } else {
          toast({
            title: "Invalid Token",
            description: "This password reset link is invalid or expired",
            variant: "destructive",
          });
        }
      })
      .catch(() => {
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Something went wrong while validating token",
          variant: "destructive",
        });
      });
  }, [searchParams, toast]);

  // Handle reset password
  const handleResetPassword = () => {
    if (!password || !confirmPassword) {
      toast({
        title: "Password Required",
        description: "Please fill in both fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Invalid Token",
        description: "Cannot reset password without a valid token",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    ConfirmPassword({ password, token })
      .then(() => {
        setIsLoading(false);
        setPasswordReset(true);
        toast({
          title: "Password Reset Successful",
          description: "You can now sign in with your new password",
        });
      })
      .catch(() => {
        setIsLoading(false);
        toast({
          title: "Error",
          description: "Failed to reset password. Try again later",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Button variant="ghost" className="gap-2" onClick={() => navigate('/signin')}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {passwordReset ? (
                <CheckCircle className="w-6 h-6 text-primary" />
              ) : (
                <Lock className="w-6 h-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {passwordReset ? 'Success!' : 'Reset Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {passwordReset
                ? 'Your password has been reset successfully.'
                : isTokenValid
                ? 'Enter your new password below to reset it.'
                : 'Validating token...'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isTokenValid && !passwordReset && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12"
                  />
                </div>

                <Button className="w-full h-12" onClick={handleResetPassword} disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </>
            )}

            {passwordReset && (
              <Button variant="ghost" className="w-full" onClick={() => navigate('/signin')}>
                Go to Sign In
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
