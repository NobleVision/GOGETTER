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
import { 
  User, 
  Shield, 
  Bell, 
  DollarSign,
  Save,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  
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
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="font-semibold text-white">{user?.name || 'User'}</div>
                <div className="text-sm text-muted-foreground">{user?.email || 'No email'}</div>
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
