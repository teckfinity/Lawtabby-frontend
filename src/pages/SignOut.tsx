import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const SignOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear authentication status on mount
    localStorage.removeItem('isAuthenticated');
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Signed Out Successfully</CardTitle>
            <CardDescription>
              You have been safely signed out of your LegalAI Pro account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Thank you for using LegalAI Pro. Your session has been ended and all data has been secured.
              </p>
              
              <div className="space-y-2">
                <Button 
                  className="w-full h-12" 
                  onClick={() => navigate('/signin')}
                >
                  Sign In Again
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12" 
                  onClick={() => {
                    // Show a simple message since they're already signed out
                    window.location.href = 'https://legalai-pro.com';
                  }}
                >
                  Visit Website
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
              Need help? {' '}
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary text-sm"
                onClick={() => navigate('/contact-support')}
              >
                Contact Support
              </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignOut;