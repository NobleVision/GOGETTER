import AccessRestricted from "@/components/AccessRestricted";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, useReducedMotion } from "framer-motion";
import { interiorPageMotion } from "@/lib/interiorMotion";
import { usePermissions } from "@/_core/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Copy,
  CheckCircle2,
  ExternalLink,
  Code,
  Zap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_TYPES = [
  { id: 'revenue', label: 'Revenue Events', description: 'When revenue is generated' },
  { id: 'cost', label: 'Cost Events', description: 'When costs are incurred' },
  { id: 'error', label: 'Error Events', description: 'When errors occur' },
  { id: 'intervention', label: 'Intervention Required', description: 'When human action is needed' },
  { id: 'status_change', label: 'Status Changes', description: 'When business status changes' },
  { id: 'agent_activity', label: 'Agent Activity', description: 'Agent actions and updates' },
];

export default function Webhooks() {
  const { can } = usePermissions();
  if (!can("webhooks")) {
    return (
      <DashboardLayout>
        <AccessRestricted featureName="Webhooks" />
      </DashboardLayout>
    );
  }
  return <WebhooksContent />;
}

function WebhooksContent() {
  const utils = trpc.useUtils();
  const { data: webhooks, isLoading } = trpc.webhooks.list.useQuery();
  const { data: userBusinesses } = trpc.userBusinesses.list.useQuery();
  
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    secret: '',
    userBusinessId: '',
    events: [] as string[],
  });

  const createWebhook = trpc.webhooks.create.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
      toast.success("Webhook created successfully");
      setShowCreate(false);
      setFormData({ name: '', url: '', secret: '', userBusinessId: '', events: [] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create webhook");
    }
  });

  const deleteWebhook = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate();
      toast.success("Webhook deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete webhook");
    }
  });

  const toggleEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId]
    }));
  };

  const handleCreate = () => {
    if (!formData.name || !formData.url) {
      toast.error("Name and URL are required");
      return;
    }
    createWebhook.mutate({
      name: formData.name,
      url: formData.url,
      secret: formData.secret || undefined,
      userBusinessId: formData.userBusinessId ? parseInt(formData.userBusinessId) : undefined,
      events: formData.events.length > 0 ? formData.events : undefined,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const samplePayload = `{
  "event": "revenue",
  "timestamp": "2025-01-04T12:00:00Z",
  "business_id": 1,
  "data": {
    "amount": "25.50",
    "currency": "USD",
    "source": "affiliate_sale"
  }
}`;

  const shouldReduceMotion = useReducedMotion();
  const pageMotion = interiorPageMotion(!!shouldReduceMotion);

  return (
    <DashboardLayout>
      <motion.div className="space-y-6" {...pageMotion.container}>
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          {...pageMotion.header}
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Webhooks</h1>
            <p className="text-slate-300">Configure webhook endpoints for real-time business events</p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0">
                <Plus className="mr-2 h-4 w-4" />
                Create Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-white">Create Webhook</DialogTitle>
                <DialogDescription>
                  Configure a new webhook endpoint to receive business events
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Name</Label>
                  <Input
                    id="name"
                    placeholder="My Webhook"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-white">Endpoint URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://your-server.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secret" className="text-white">Secret (optional)</Label>
                  <Input
                    id="secret"
                    type="password"
                    placeholder="webhook_secret_..."
                    value={formData.secret}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to sign webhook payloads for verification
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Business (optional)</Label>
                  <Select 
                    value={formData.userBusinessId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, userBusinessId: v }))}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="All businesses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All businesses</SelectItem>
                      {userBusinesses?.map(ub => (
                        <SelectItem key={ub.id} value={ub.id.toString()}>
                          {ub.business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Events</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {EVENT_TYPES.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => toggleEvent(event.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          formData.events.includes(event.id)
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-border hover:border-emerald-500/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox 
                            checked={formData.events.includes(event.id)}
                            className="mt-0.5"
                          />
                          <div>
                            <div className="text-sm font-medium text-white">{event.label}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to receive all events
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border-border"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={createWebhook.isPending}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0"
                >
                  {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Webhooks List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : webhooks && webhooks.length > 0 ? (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Webhook className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{webhook.name}</h3>
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          <span className="font-mono truncate max-w-md">{webhook.url}</span>
                          <button 
                            onClick={() => copyToClipboard(webhook.url)}
                            className="text-muted-foreground hover:text-white"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        {webhook.events && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(typeof webhook.events === 'string' 
                              ? JSON.parse(webhook.events) 
                              : webhook.events
                            ).map((event: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebhook.mutate({ id: webhook.id })}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Webhook className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Webhooks Configured</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create a webhook to receive real-time notifications about your business events.
              </p>
              <Button 
                onClick={() => setShowCreate(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Webhook
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Documentation */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Code className="h-5 w-5 text-emerald-400" />
              Webhook Payload Format
            </CardTitle>
            <CardDescription>Example payload sent to your webhook endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="p-4 rounded-lg bg-secondary/50 text-sm text-muted-foreground overflow-x-auto">
                <code>{samplePayload}</code>
              </pre>
              <button
                onClick={() => copyToClipboard(samplePayload)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-white transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-white">Webhook Security</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    If you provide a secret, payloads will include an <code className="text-amber-400">X-Webhook-Signature</code> header containing an HMAC-SHA256 signature. Verify this signature to ensure payloads are authentic.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
