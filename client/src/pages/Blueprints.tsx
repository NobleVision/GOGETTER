import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { 
  Rocket, 
  Code, 
  Server, 
  Cpu, 
  DollarSign,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCode,
  Database,
  Webhook,
  Shield,
  Zap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function Blueprints() {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | undefined>();
  
  const { data: businesses, isLoading: businessesLoading } = trpc.businesses.list.useQuery({});
  const { data: selectedBusiness } = trpc.businesses.get.useQuery(
    { id: parseInt(selectedBusinessId || '0') },
    { enabled: !!selectedBusinessId }
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return '-';
    return `$${parseFloat(value).toFixed(2)}`;
  };

  // Generate sample code based on business type
  const generateSampleCode = (business: typeof selectedBusiness) => {
    if (!business) return '';
    return `// ${business.name} - Agent Implementation
import { GoGetterAgent } from '@go-getter/sdk';

const agent = new GoGetterAgent({
  business: '${business.name.toLowerCase().replace(/\s+/g, '-')}',
  models: ${JSON.stringify(business.recommendedModels || ['gpt-4o-mini'])},
  tokenBudget: 100, // Daily token budget in USD
});

// Main execution loop
async function run() {
  while (true) {
    try {
      // 1. Check for opportunities
      const opportunities = await agent.scan();
      
      // 2. Evaluate and prioritize
      const ranked = await agent.prioritize(opportunities);
      
      // 3. Execute top opportunities
      for (const opp of ranked.slice(0, 5)) {
        const result = await agent.execute(opp);
        
        // 4. Log results
        await agent.logEvent({
          type: result.success ? 'revenue' : 'error',
          amount: result.revenue,
          data: result.metadata,
        });
      }
      
      // 5. Wait before next cycle
      await agent.sleep(60 * 1000); // 1 minute
    } catch (error) {
      await agent.logEvent({
        type: 'error',
        message: error.message,
        requiresIntervention: true,
      });
    }
  }
}

run();`;
  };

  const generateInfraCode = (business: typeof selectedBusiness) => {
    if (!business) return '';
    return `# Docker Compose for ${business.name}
version: '3.8'

services:
  agent:
    build: .
    environment:
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY}
      - WEBHOOK_URL=\${WEBHOOK_URL}
      - TOKEN_BUDGET=100
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

volumes:
  redis_data:`;
  };

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
            <h1 className="text-2xl font-bold text-white">Deployment Blueprints</h1>
            <p className="text-slate-300">Step-by-step guides for implementing autonomous businesses</p>
          </div>
          <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
            <SelectTrigger className="w-[280px] bg-secondary border-border">
              <SelectValue placeholder="Select a business" />
            </SelectTrigger>
            <SelectContent>
              {businesses?.map(b => (
                <SelectItem key={b.id} value={b.id.toString()}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBusiness ? (
          <>
            {/* Business Overview */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-white">{selectedBusiness.name}</CardTitle>
                    <CardDescription className="mt-1">{selectedBusiness.description}</CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${
                      selectedBusiness.scoreTier === 'prime' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : selectedBusiness.scoreTier === 'stable'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {selectedBusiness.scoreTier} tier
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">Revenue/Hour</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(selectedBusiness.estimatedRevenuePerHour)}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <Cpu className="h-4 w-4" />
                      <span className="text-sm font-medium">Token Cost/Hour</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(selectedBusiness.estimatedTokenCostPerHour)}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Setup Time</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {selectedBusiness.setupTimeHours || '-'} hours
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Server className="h-4 w-4" />
                      <span className="text-sm font-medium">Min Agents</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                      {selectedBusiness.minAgentsRequired || 1}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blueprint Tabs */}
            <Tabs defaultValue="guide" className="space-y-4">
              <TabsList className="bg-secondary">
                <TabsTrigger value="guide">Implementation Guide</TabsTrigger>
                <TabsTrigger value="code">Code Scaffold</TabsTrigger>
                <TabsTrigger value="infra">Infrastructure</TabsTrigger>
                <TabsTrigger value="apis">APIs & Integrations</TabsTrigger>
              </TabsList>

              <TabsContent value="guide">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-emerald-400" />
                      Step-by-Step Implementation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-6">
                        {/* Step 1 */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                              1
                            </div>
                            <div className="flex-1 w-px bg-border mt-2" />
                          </div>
                          <div className="flex-1 pb-6">
                            <h4 className="font-semibold text-white mb-2">Configure API Keys</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Set up your AI model provider credentials in the API Configuration page.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedBusiness.recommendedModels && (
                                (typeof selectedBusiness.recommendedModels === 'string' 
                                  ? JSON.parse(selectedBusiness.recommendedModels) 
                                  : selectedBusiness.recommendedModels
                                ).map((model: string, idx: number) => (
                                  <Badge key={idx} variant="outline">{model}</Badge>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                              2
                            </div>
                            <div className="flex-1 w-px bg-border mt-2" />
                          </div>
                          <div className="flex-1 pb-6">
                            <h4 className="font-semibold text-white mb-2">Set Up Infrastructure</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Deploy the agent runtime using Docker or your preferred container platform.
                            </p>
                            {selectedBusiness.infraRequirements && (
                              <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                                <ul className="space-y-1 text-muted-foreground">
                                  {(typeof selectedBusiness.infraRequirements === 'string' 
                                    ? JSON.parse(selectedBusiness.infraRequirements) 
                                    : selectedBusiness.infraRequirements
                                  ).map((req: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                              3
                            </div>
                            <div className="flex-1 w-px bg-border mt-2" />
                          </div>
                          <div className="flex-1 pb-6">
                            <h4 className="font-semibold text-white mb-2">Configure Webhooks</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Set up webhook endpoints to receive real-time business events and KPIs.
                            </p>
                            <Button variant="outline" size="sm" className="border-border">
                              <Webhook className="mr-2 h-4 w-4" />
                              Go to Webhooks
                            </Button>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                              4
                            </div>
                            <div className="flex-1 w-px bg-border mt-2" />
                          </div>
                          <div className="flex-1 pb-6">
                            <h4 className="font-semibold text-white mb-2">Deploy Agent Code</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Use the code scaffold from the "Code Scaffold" tab as your starting point.
                            </p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                              5
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-2">Monitor & Optimize</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Use the Monitoring dashboard to track performance and optimize token usage.
                            </p>
                          </div>
                        </div>

                        {/* Custom Guide */}
                        {selectedBusiness.implementationGuide && (
                          <div className="mt-6 p-4 rounded-lg bg-secondary/50">
                            <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-emerald-400" />
                              Business-Specific Notes
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {selectedBusiness.implementationGuide}
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileCode className="h-5 w-5 text-emerald-400" />
                        Agent Code Scaffold
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(generateSampleCode(selectedBusiness))}
                        className="border-border"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Code
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 rounded-lg bg-secondary/50 text-sm text-muted-foreground overflow-x-auto">
                      <code>{generateSampleCode(selectedBusiness)}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="infra">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Server className="h-5 w-5 text-emerald-400" />
                        Infrastructure Configuration
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(generateInfraCode(selectedBusiness))}
                        className="border-border"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Config
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <pre className="p-4 rounded-lg bg-secondary/50 text-sm text-muted-foreground overflow-x-auto">
                      <code>{generateInfraCode(selectedBusiness)}</code>
                    </pre>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="p-4 rounded-lg bg-secondary/50">
                        <h4 className="font-medium text-white mb-2">Estimated Costs</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>Infrastructure/Day:</span>
                            <span className="text-white">{formatCurrency(selectedBusiness.estimatedInfraCostPerDay)}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Token Cost/Hour:</span>
                            <span className="text-white">{formatCurrency(selectedBusiness.estimatedTokenCostPerHour)}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Setup Cost:</span>
                            <span className="text-white">{formatCurrency(selectedBusiness.setupCost)}</span>
                          </li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/50">
                        <h4 className="font-medium text-white mb-2">Resource Requirements</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex justify-between">
                            <span>Memory:</span>
                            <span className="text-white">512MB - 1GB</span>
                          </li>
                          <li className="flex justify-between">
                            <span>CPU:</span>
                            <span className="text-white">0.5 - 1 vCPU</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Storage:</span>
                            <span className="text-white">10GB SSD</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="apis">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Database className="h-5 w-5 text-emerald-400" />
                      Required APIs & Integrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedBusiness.requiredApis ? (
                        (typeof selectedBusiness.requiredApis === 'string' 
                          ? JSON.parse(selectedBusiness.requiredApis) 
                          : selectedBusiness.requiredApis
                        ).map((api: string, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-emerald-400" />
                              </div>
                              <div>
                                <div className="font-medium text-white">{api}</div>
                                <div className="text-sm text-muted-foreground">Required integration</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="border-border">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Docs
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No external APIs required for this business
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Rocket className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Business</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Choose a business from the dropdown above to view its deployment blueprint and implementation guide.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
