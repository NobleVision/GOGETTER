import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { 
  User, 
  Shield, 
  Bell, 
  DollarSign,
  Save,
  RefreshCw,
  Link,
  CheckCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const [location] = useLocation();
  
  const [formData, setFormData] = useState({
    riskTolerance: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
    capitalAvailable: '',
    monthlyTokenBudget: '100',
    aggressiveness: 'medium' as 'low' | 'medium' | 'high',
    strategyTimeframe: 'medium' as 'short' | 'medium' | 'long',
  });

  const [notifications, setNotifications] = useState({
    revenue: true,
    errors: true,
    interventions: true,
    dailySummary: true,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        riskTolerance: profile.riskTolerance || 'moderate',
        capitalAvailable: profile.capitalAvailable || '',
        monthlyTokenBudget: profile.monthlyTokenBudget || '100',
        aggressiveness: profile.aggressiveness || 'medium',
        strategyTimeframe: profile.strategyTimeframe || 'medium',
      });
    }
  }, [profile]);

  // Handle URL parameters for OAuth results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');

    if (error) {
      switch (error) {
        case 'google_link_denied':
          toast.error("Google linking was cancelled");
          break;
        case 'google_link_invalid':
          toast.error("Invalid Google linking request");
          break;
        case 'google_link_state_invalid':
          toast.error("Google linking session expired");
          break;
        case 'google_link_no_email':
          toast.error("Google account has no email address");
          break;
        case 'google_account_already_linked':
          toast.error("This Google account is already linked to another user");
          break;
        case 'google_link_failed':
          toast.error("Failed to link Google account");
          break;
        case 'user_not_found':
          toast.error("User session not found");
          break;
        default:
          toast.error("An error occurred during linking");
      }
      // Clear the error from URL
      window.history.replaceState({}, '', '/settings');
    }

    if (success) {
      switch (success) {
        case 'google_linked':
          toast.success("Google account linked successfully!");
          break;
        default:
          toast.success("Account linked successfully!");
      }
      // Clear the success from URL and refresh user data
      window.history.replaceState({}, '', '/settings');
      window.location.reload(); // Refresh to get updated user data
    }
  }, [location]);

  const updateProfile = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    }
  });

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const handleLinkGoogle = () => {
    window.location.href = '/api/oauth/google/link';
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {/* Profile Info */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {user?.pictureUrl ? (
                  <img 
                    src={user.pictureUrl} 
                    alt={user.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <div>
                <div className="font-semibold text-white">{user?.name || 'User'}</div>
                <div className="text-sm text-muted-foreground">{user?.email || 'No email'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Providers */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Link className="h-5 w-5 text-emerald-400" />
              Linked Providers
            </CardTitle>
            <CardDescription>Authentication providers connected to your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Google Provider */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">Google</div>
                    <div className="text-sm text-muted-foreground">
                      {user?.authProviders?.includes('google') ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.authProviders?.includes('google') ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-border"
                      onClick={handleLinkGoogle}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>

              {/* Manus Provider */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                    M
                  </div>
                  <div>
                    <div className="font-medium text-white">Manus</div>
                    <div className="text-sm text-muted-foreground">
                      {user?.authProviders?.includes('manus') ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user?.authProviders?.includes('manus') ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-border" 
                      disabled
                      title="Manus linking not yet available"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk & Strategy */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              Risk & Strategy
            </CardTitle>
            <CardDescription>Configure your business preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-white">Risk Tolerance</Label>
                  <RadioGroup 
                    value={formData.riskTolerance} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, riskTolerance: v as any }))}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { value: 'conservative', label: 'Conservative' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'aggressive', label: 'Aggressive' },
                    ].map((option) => (
                      <div 
                        key={option.value}
                        className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.riskTolerance === option.value 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-border hover:border-emerald-500/50'
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                        <Label htmlFor={option.value} className="cursor-pointer text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Strategy Timeframe</Label>
                  <RadioGroup 
                    value={formData.strategyTimeframe} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, strategyTimeframe: v as any }))}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { value: 'short', label: 'Short (1-3 mo)' },
                      { value: 'medium', label: 'Medium (3-12 mo)' },
                      { value: 'long', label: 'Long (1+ yr)' },
                    ].map((option) => (
                      <div 
                        key={option.value}
                        className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.strategyTimeframe === option.value 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-border hover:border-emerald-500/50'
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={`tf-${option.value}`} className="sr-only" />
                        <Label htmlFor={`tf-${option.value}`} className="cursor-pointer text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Aggressiveness</Label>
                  <RadioGroup 
                    value={formData.aggressiveness} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, aggressiveness: v as any }))}
                    className="grid grid-cols-3 gap-3"
                  >
                    {[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ].map((option) => (
                      <div 
                        key={option.value}
                        className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.aggressiveness === option.value 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-border hover:border-emerald-500/50'
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={`agg-${option.value}`} className="sr-only" />
                        <Label htmlFor={`agg-${option.value}`} className="cursor-pointer text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Budget
            </CardTitle>
            <CardDescription>Set your financial limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capital" className="text-white">Available Capital (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="capital"
                    type="number"
                    placeholder="10000"
                    value={formData.capitalAvailable}
                    onChange={(e) => setFormData(prev => ({ ...prev, capitalAvailable: e.target.value }))}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenBudget" className="text-white">Monthly Token Budget (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tokenBudget"
                    type="number"
                    placeholder="100"
                    value={formData.monthlyTokenBudget}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyTokenBudget: e.target.value }))}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-400" />
              Notifications
            </CardTitle>
            <CardDescription>Configure alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'revenue', label: 'Revenue Events', description: 'Get notified when your businesses generate revenue' },
              { id: 'errors', label: 'Error Alerts', description: 'Receive alerts when errors occur' },
              { id: 'interventions', label: 'Intervention Required', description: 'Alert when human action is needed' },
              { id: 'dailySummary', label: 'Daily Summary', description: 'Receive a daily performance summary' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-white">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                </div>
                <Switch
                  checked={notifications[item.id as keyof typeof notifications]}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.id]: checked }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="border-border"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
          >
            <Save className="mr-2 h-4 w-4" />
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
