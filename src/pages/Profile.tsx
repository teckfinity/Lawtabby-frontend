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
import { getUserProfile } from '@/api'; // <-- import the API function

const Profile = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true); // loading state
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    plan: 'Free Plan',
    avatar: ''
  });

  // Editing states
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  const [siteSettings, setSiteSettings] = useState({
    siteName: 'LegalAI Pro',
    darkMode: false,
    notifications: true,
    autoSave: true
  });

  const [isSubscriptionPopupOpen, setIsSubscriptionPopupOpen] = useState(false);

  // ------------------- Fetch user profile on mount -------------------
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getUserProfile();
        setProfile({
          username: data.name || '',
          email: data.email || '',
          plan: data.plan || 'Free Plan',
          avatar: data.avatar || 'https://via.placeholder.com/150'
        });
        setTempUsername(data.username || '');
        setTempEmail(data.email || '');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch user profile.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ------------------- Existing handlers remain unchanged -------------------
  const handleSaveUsername = () => {
    if (tempUsername.trim()) {
      setProfile({ ...profile, username: tempUsername });
      setIsEditingUsername(false);
      toast({
        title: "Username updated",
        description: "Your username has been successfully updated."
      });
    }
  };

  const handleSaveEmail = () => {
    if (tempEmail.trim() && tempEmail.includes('@')) {
      setProfile({ ...profile, email: tempEmail });
      setIsEditingEmail(false);
      toast({
        title: "Email updated",
        description: "Your email has been successfully updated."
      });
    } else {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
    }
  };

  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfile({ ...profile, avatar: e.target?.result as string });
          toast({
            title: "Avatar updated",
            description: "Your profile picture has been updated."
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSignOut = () => navigate('/signout');

  const handleDeleteAccount = () => toast({
    title: "Account deletion requested",
    description: "Please contact support to complete account deletion.",
    variant: "destructive"
  });

  const getThemeLabel = () => theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';
  const getThemeIcon = () => theme === 'light' ? <Sun className="h-4 w-4" /> : theme === 'dark' ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />;
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
                  <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
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

            {/* Username */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Username</Label>
                <p className="text-sm text-muted-foreground">
                  Your unique username
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isEditingUsername ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      className="w-48"
                      placeholder="Enter username"
                    />
                    <Button size="sm" onClick={handleSaveUsername}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingUsername(false);
                        setTempUsername(profile.username);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{profile.username}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingUsername(true)}
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

        {/* Site Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
            <CardDescription>
              Configure your site preferences and behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Site Name</Label>
                <p className="text-sm text-muted-foreground">
                  The name of your legal workspace
                </p>
              </div>
              <Input
                value={siteSettings.siteName}
                onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                className="w-48"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for updates
                </p>
              </div>
              <Switch
                checked={siteSettings.notifications}
                onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto Save</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save your work
                </p>
              </div>
              <Switch
                checked={siteSettings.autoSave}
                onCheckedChange={(checked) => setSiteSettings({ ...siteSettings, autoSave: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Section */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Manage your subscription and billing information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan: {profile.plan}</p>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock premium features and increased limits.
                </p>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={() => navigate('/subscription')}
              >
                <ExternalLink className="h-4 w-4" />
                Learn more
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Popup */}
      <SubscriptionPopup 
        isOpen={isSubscriptionPopupOpen}
        onClose={() => setIsSubscriptionPopupOpen(false)}
        currentPlan={profile.plan}
      />
    </div>
  );
};

export default Profile;
