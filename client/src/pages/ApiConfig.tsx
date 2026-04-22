import AccessRestricted from "@/components/AccessRestricted";
import DashboardLayout from "@/components/DashboardLayout";
import { usePermissions } from "@/_core/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Zap, 
  Key, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Save
} from "lucide-react";

const API_PROVIDERS = [
  { 
    id: 'manus', 
    name: 'Manus', 
    description: 'Built-in AI capabilities',
    docsUrl: 'https://docs.manus.im',
    color: 'emerald',
    builtin: true
  },
  { 
    id: 'openai', 
    name: 'OpenAI', 
    description: 'GPT-4o, GPT-4o-mini, DALL-E',
    docsUrl: 'https://platform.openai.com/docs',
    color: 'green'
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    description: 'Claude 3 Opus, Sonnet, Haiku',
    docsUrl: 'https://docs.anthropic.com',
    color: 'purple'
  },
  { 
    id: 'perplexity', 
    name: 'Perplexity', 
    description: 'Real-time web search AI',
    docsUrl: 'https://docs.perplexity.ai',
    color: 'blue'
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini', 
    description: 'Gemini Pro, Gemini Flash',
    docsUrl: 'https://ai.google.dev/docs',
    color: 'yellow'
  },
  { 
    id: 'grok', 
    name: 'xAI Grok', 
    description: 'Grok-1, real-time knowledge',
    docsUrl: 'https://x.ai/api',
    color: 'red'
  },
];

export default function ApiConfig() {
  const { can } = usePermissions();
  if (!can("apiConfig")) {
    return (
      <DashboardLayout>
        <AccessRestricted featureName="API Config" />
      </DashboardLayout>
    );
  }
  return <ApiConfigContent />;
}

function ApiConfigContent() {
  const utils = trpc.useUtils();
  const { data: configs, isLoading } = trpc.apiConfig.list.useQuery();
  
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, { apiKey: string; baseUrl: string; isActive: boolean }>>({});

  const upsertConfig = trpc.apiConfig.upsert.useMutation({
    onSuccess: () => {
      utils.apiConfig.list.invalidate();
      toast.success("API configuration saved");
      setEditingProvider(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save configuration");
    }
  });

  const getConfig = (providerId: string) => {
    return configs?.find(c => c.provider === providerId);
  };

  const handleEdit = (providerId: string) => {
    const existing = getConfig(providerId);
    setFormData(prev => ({
      ...prev,
      [providerId]: {
        apiKey: existing?.apiKey || '',
        baseUrl: existing?.baseUrl || '',
        isActive: existing?.isActive ?? true,
      }
    }));
    setEditingProvider(providerId);
  };

  const handleSave = (providerId: string) => {
    const data = formData[providerId];
    if (!data) return;
    
    upsertConfig.mutate({
      provider: providerId as any,
      apiKey: data.apiKey || undefined,
      baseUrl: data.baseUrl || undefined,
      isActive: data.isActive,
    });
  };

  const toggleShowKey = (providerId: string) => {
    setShowKey(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const shouldReduceMotion = useReducedMotion();
  const pageMotion = interiorPageMotion(!!shouldReduceMotion);

  return (
    <DashboardLayout>
      <motion.div className="space-y-6" {...pageMotion.container}>
        {/* Header */}
        <motion.div {...pageMotion.header}>
          <h1 className="text-2xl font-bold text-white">API Configuration</h1>
          <p className="text-slate-300">Configure AI model providers for your autonomous businesses</p>
        </motion.div>

        {/* Info Card */}
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="flex items-start gap-4 p-4">
            <Zap className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-medium text-white">Built-in AI Capabilities</p>
              <p className="text-sm text-muted-foreground mt-1">
                GO-GETTER OS includes built-in Manus AI capabilities. Configure additional providers below to expand your agent's model options and optimize for cost/performance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Provider Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {API_PROVIDERS.map((provider) => {
            const config = getConfig(provider.id);
            const isEditing = editingProvider === provider.id;
            const data = formData[provider.id] || { apiKey: '', baseUrl: '', isActive: true };
            
            return (
              <Card key={provider.id} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg bg-${provider.color}-500/20 flex items-center justify-center`}>
                        <Zap className={`h-5 w-5 text-${provider.color}-400`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          {provider.name}
                          {provider.builtin && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                              Built-in
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{provider.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config?.isActive || provider.builtin ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : config ? (
                        <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/30">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                          Not Configured
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`${provider.id}-key`} className="text-white">API Key</Label>
                        <div className="relative">
                          <Input
                            id={`${provider.id}-key`}
                            type={showKey[provider.id] ? 'text' : 'password'}
                            placeholder="sk-..."
                            value={data.apiKey}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              [provider.id]: { ...data, apiKey: e.target.value }
                            }))}
                            className="pr-10 bg-secondary border-border"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowKey(provider.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                          >
                            {showKey[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${provider.id}-url`} className="text-white">Base URL (optional)</Label>
                        <Input
                          id={`${provider.id}-url`}
                          type="url"
                          placeholder="https://api.example.com/v1"
                          value={data.baseUrl}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [provider.id]: { ...data, baseUrl: e.target.value }
                          }))}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={data.isActive}
                            onCheckedChange={(checked) => setFormData(prev => ({
                              ...prev,
                              [provider.id]: { ...data, isActive: checked }
                            }))}
                          />
                          <Label className="text-sm text-muted-foreground">Enable this provider</Label>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingProvider(null)}
                          className="flex-1 border-border"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSave(provider.id)}
                          disabled={upsertConfig.isPending}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {upsertConfig.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {config && (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">API Key:</span>
                            <span className="text-white font-mono">
                              {config.apiKey ? '••••••••' + config.apiKey.slice(-4) : 'Not set'}
                            </span>
                          </div>
                          {config.baseUrl && (
                            <div className="flex items-center gap-2">
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Base URL:</span>
                              <span className="text-white truncate">{config.baseUrl}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(provider.docsUrl, '_blank')}
                          className="flex-1 border-border"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Docs
                        </Button>
                        {!provider.builtin && (
                          <Button 
                            onClick={() => handleEdit(provider.id)}
                            className="flex-1 bg-secondary hover:bg-secondary/80 text-white border-0"
                          >
                            {config ? 'Edit' : 'Configure'}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Token Efficiency Tips */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Token Efficiency Tips</CardTitle>
            <CardDescription>Optimize costs while maintaining quality</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium text-white mb-2">Use Smaller Models for Routine Tasks</h4>
                <p className="text-sm text-muted-foreground">
                  GPT-4o-mini and Claude 3 Haiku are 10-20x cheaper than their larger counterparts. Use them for classification, summarization, and simple generation.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium text-white mb-2">Reserve Premium Models for Complex Tasks</h4>
                <p className="text-sm text-muted-foreground">
                  Use GPT-4o or Claude 3 Opus only for tasks requiring deep reasoning, code generation, or nuanced analysis.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium text-white mb-2">Implement Caching</h4>
                <p className="text-sm text-muted-foreground">
                  Cache common queries and responses to avoid redundant API calls. This can reduce costs by 30-50%.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <h4 className="font-medium text-white mb-2">Set Token Budgets</h4>
                <p className="text-sm text-muted-foreground">
                  Configure monthly token budgets in your profile to prevent runaway costs. GO-GETTER OS will alert you when approaching limits.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
