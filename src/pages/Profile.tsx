import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SubscriptionPopup from '@/components/SubscriptionPopup';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Edit2,
  Camera,
  Moon,
  Sun,
  Monitor,
  ExternalLink,
  LogOut,
  Trash2,
  Save
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '@/api';

const Profile = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    id: 0,
    name: '',
    email: '',
    plan: 'Free Plan',
    avatar: ''
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  const [siteSettings, setSiteSettings] = useState({
    siteName: 'LegalAI Pro',
    darkMode: false,
    notifications: true,
    autoSave: true
  });

  const [isSubscriptionPopupOpen, setIsSubscriptionPopupOpen] = useState(false);

  // ------------------- Fetch user profile -------------------
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getUserProfile();
        setProfile({
          id: data.id || 0,
          name: data.name || '',
          email: data.email || '',
          plan: data.plan || 'Free Plan',
          avatar: data.avatar || 'https://via.placeholder.com/150'
        });
        setTempName(data.name || '');
        setTempEmail(data.email || '');
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch user profile.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ------------------- Update name -------------------
  const handleSaveName = async () => {
    if (!tempName.trim()) {
      toast({
        title: 'Invalid Name',
        description: 'Name cannot be empty.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const payload = { id: profile.id, name: tempName };
      const updatedData = await updateUserProfile(payload);
      setProfile((prev) => ({ ...prev, name: updatedData.name }));
      setIsEditingName(false);

      toast({
        title: 'Name updated',
        description: 'Your name has been successfully updated.'
      });
} catch (error: any) {
  console.error("Update name error:", error?.response?.data || error);
  toast({
    title: 'Update failed',
    description: error?.response?.data?.detail || error?.message || 'Could not update name. Please try again.',
    variant: 'destructive'
  });
}

  };

  // ------------------- Update avatar -------------------
  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Image = event.target?.result as string;

          try {
            const payload = { id: profile.id, avatar: base64Image };
            const updatedData = await updateUserProfile(payload);

            setProfile((prev) => ({ ...prev, avatar: updatedData.avatar }));
            toast({
              title: 'Avatar updated',
              description: 'Your profile picture has been updated.'
            });
          } catch (error) {
            toast({
              title: 'Upload failed',
              description: 'Could not update avatar. Please try again.',
              variant: 'destructive'
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // ------------------- Update email (local only) -------------------
  const handleSaveEmail = () => {
    if (tempEmail.trim() && tempEmail.includes('@')) {
      setProfile({ ...profile, email: tempEmail });
      setIsEditingEmail(false);
      toast({
        title: 'Email updated',
        description: 'Your email has been successfully updated.'
      });
    } else {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
    }
  };

  // ------------------- Theme & Navigation -------------------
  const handleSignOut = () => navigate('/signout');

  const handleDeleteAccount = () =>
    toast({
      title: 'Account deletion requested',
      description: 'Please contact support to complete account deletion.',
      variant: 'destructive'
    });

  const getThemeLabel = () =>
    theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

  const getThemeIcon = () =>
    theme === 'light' ? (
      <Sun className="h-4 w-4" />
    ) : theme === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const nextIndex = (themes.indexOf(theme || 'system') + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  // ------------------- Render -------------------
  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="w-full flex-col space-y-8 p-4 md:p-6 lg:p-8 lg:pl-12 md:flex">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Update your account information and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme/Appearance */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Appearance</Label>
                <p className="text-sm text-muted-foreground">
                  Choose your interface theme
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={cycleTheme}
                className="flex items-center gap-2"
              >
                {getThemeIcon()}
                {getThemeLabel()}
              </Button>
            </div>

            {/* Avatar */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Avatar</Label>
                <p className="text-sm text-muted-foreground">
                  Your profile picture
                </p>
              </div>
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar} alt="Profile" />
                  <AvatarFallback>
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAvatarUpload}
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Name */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Name</Label>
                <p className="text-sm text-muted-foreground">
                  Your display name
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-48"
                      placeholder="Enter name"
                    />
                    <Button size="sm" onClick={handleSaveName}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingName(false);
                        setTempName(profile.name);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{profile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">
                  Your email address
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEditingEmail ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="w-48"
                      placeholder="Enter email"
                    />
                    <Button size="sm" onClick={handleSaveEmail}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingEmail(false);
                        setTempEmail(profile.email);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{profile.email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingEmail(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Plan */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Plan</Label>
                <p className="text-sm text-muted-foreground">
                  Your current subscription plan
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{profile.plan}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubscriptionPopupOpen(true)}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Popup */}
        <SubscriptionPopup
          isOpen={isSubscriptionPopupOpen}
          onClose={() => setIsSubscriptionPopupOpen(false)}
          currentPlan={profile.plan}
        />
      </div>
    </div>
  );
};

export default Profile;
