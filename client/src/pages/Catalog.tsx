import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { 
  Search, 
  Filter,
  TrendingUp,
  Cpu,
  DollarSign,
  Clock,
  Users,
  AlertTriangle,
  Rocket,
  Star,
  ChevronRight,
  Zap,
  Shield,
  BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Business = {
  id: number;
  name: string;
  description: string;
  vertical: string;
  compositeScore: number;
  scoreTier: string;
  guaranteedDemand: number;
  automationLevel: number;
  tokenEfficiency: number;
  profitMargin: number;
  maintenanceCost: number;
  legalRisk: number;
  competitionSaturation: number;
  estimatedRevenuePerHour: string | null;
  estimatedTokenCostPerHour: string | null;
  estimatedInfraCostPerDay: string | null;
  setupCost: string | null;
  setupTimeHours: number | null;
  minAgentsRequired: number | null;
  recommendedModels: string[] | null;
  requiredApis: string[] | null;
  infraRequirements: string[] | null;
  implementationGuide: string | null;
};

const VERTICALS = [
  { value: "all", label: "All Verticals" },
  { value: "content_media", label: "Content & Media" },
  { value: "digital_services", label: "Digital Services" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "data_insights", label: "Data & Insights" },
];

const TIER_STYLES = {
  prime: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", label: "Prime" },
  stable: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", label: "Stable" },
  experimental: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", label: "Experimental" },
  archived: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30", label: "Archived" },
};

function ScoreBar({ label, value, color = "emerald" }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`text-${color}-400`}>{value}/100</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

function BusinessCard({ business, onDeploy }: { business: Business; onDeploy: () => void }) {
  const tier = TIER_STYLES[business.scoreTier as keyof typeof TIER_STYLES] || TIER_STYLES.experimental;
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (value: string | null) => {
    if (!value) return '-';
    return `$${parseFloat(value).toFixed(2)}`;
  };

  return (
    <Card className="bg-card border-border hover:border-emerald-500/30 transition-all group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`${tier.bg} ${tier.text} ${tier.border} text-xs`}>
                {tier.label}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {business.vertical.replace('_', ' ')}
              </Badge>
            </div>
            <CardTitle className="text-lg text-white group-hover:text-emerald-400 transition-colors">
              {business.name}
            </CardTitle>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold text-emerald-400">{business.compositeScore}</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>
        <CardDescription className="line-clamp-2">{business.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-lg bg-secondary/50">
            <DollarSign className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
            <div className="text-sm font-medium text-white">{formatCurrency(business.estimatedRevenuePerHour)}/hr</div>
            <div className="text-xs text-muted-foreground">Revenue</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50">
            <Cpu className="h-4 w-4 mx-auto text-amber-400 mb-1" />
            <div className="text-sm font-medium text-white">{formatCurrency(business.estimatedTokenCostPerHour)}/hr</div>
            <div className="text-xs text-muted-foreground">Token Cost</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/50">
            <Clock className="h-4 w-4 mx-auto text-blue-400 mb-1" />
            <div className="text-sm font-medium text-white">{business.setupTimeHours || '-'}h</div>
            <div className="text-xs text-muted-foreground">Setup</div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          <ScoreBar label="Demand" value={business.guaranteedDemand} />
          <ScoreBar label="Automation" value={business.automationLevel} />
          <ScoreBar label="Token Efficiency" value={business.tokenEfficiency} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 border-border">
                Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] bg-card border-border">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${tier.bg} ${tier.text} ${tier.border}`}>
                    {tier.label}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {business.vertical.replace('_', ' ')}
                  </Badge>
                </div>
                <DialogTitle className="text-xl text-white">{business.name}</DialogTitle>
                <DialogDescription>{business.description}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* Score Breakdown */}
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                      Score Breakdown
                    </h4>
                    <div className="grid gap-3">
                      <ScoreBar label="Guaranteed Demand" value={business.guaranteedDemand} />
                      <ScoreBar label="Automation Level" value={business.automationLevel} />
                      <ScoreBar label="Token Efficiency" value={business.tokenEfficiency} />
                      <ScoreBar label="Profit Margin" value={business.profitMargin} />
                      <ScoreBar label="Maintenance Cost (lower=better)" value={100 - business.maintenanceCost} color="blue" />
                      <ScoreBar label="Legal Risk (lower=better)" value={100 - business.legalRisk} color="amber" />
                      <ScoreBar label="Competition (lower=better)" value={100 - business.competitionSaturation} color="purple" />
                    </div>
                  </div>

                  {/* Financial Projections */}
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      Financial Projections
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <div className="text-sm text-muted-foreground">Revenue/Hour</div>
                        <div className="text-lg font-medium text-emerald-400">{formatCurrency(business.estimatedRevenuePerHour)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <div className="text-sm text-muted-foreground">Token Cost/Hour</div>
                        <div className="text-lg font-medium text-amber-400">{formatCurrency(business.estimatedTokenCostPerHour)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <div className="text-sm text-muted-foreground">Infra Cost/Day</div>
                        <div className="text-lg font-medium text-blue-400">{formatCurrency(business.estimatedInfraCostPerDay)}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <div className="text-sm text-muted-foreground">Setup Cost</div>
                        <div className="text-lg font-medium text-white">{formatCurrency(business.setupCost)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-emerald-400" />
                      Requirements
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <div className="text-sm text-muted-foreground">Setup Time</div>
                        <div className="font-medium text-white">{business.setupTimeHours || '-'} hours</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <div className="text-sm text-muted-foreground">Min Agents</div>
                        <div className="font-medium text-white">{business.minAgentsRequired || '-'} agents</div>
                      </div>
                    </div>
                    {business.recommendedModels && (
                      <div className="mt-3">
                        <div className="text-sm text-muted-foreground mb-2">Recommended Models</div>
                        <div className="flex flex-wrap gap-2">
                          {(typeof business.recommendedModels === 'string' 
                            ? JSON.parse(business.recommendedModels) 
                            : business.recommendedModels
                          ).map((model: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{model}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {business.requiredApis && (
                      <div className="mt-3">
                        <div className="text-sm text-muted-foreground mb-2">Required APIs</div>
                        <div className="flex flex-wrap gap-2">
                          {(typeof business.requiredApis === 'string' 
                            ? JSON.parse(business.requiredApis) 
                            : business.requiredApis
                          ).map((api: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{api}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Implementation Guide */}
                  {business.implementationGuide && (
                    <div>
                      <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-emerald-400" />
                        Implementation Guide
                      </h4>
                      <div className="p-4 rounded-lg bg-secondary/50 text-sm text-muted-foreground whitespace-pre-line">
                        {business.implementationGuide}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setShowDetails(false)} className="flex-1">
                  Close
                </Button>
                <Button 
                  onClick={() => { setShowDetails(false); onDeploy(); }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  Deploy Business
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={onDeploy}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Deploy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Catalog() {
  const [search, setSearch] = useState("");
  const [vertical, setVertical] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  const { data: businesses, isLoading } = trpc.businesses.list.useQuery({
    vertical: vertical === "all" ? undefined : vertical as any,
  });

  const deployBusiness = trpc.userBusinesses.deploy.useMutation({
    onSuccess: () => {
      toast.success("Business deployed! Check My Businesses to monitor.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to deploy business");
    }
  });

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    
    let filtered = businesses.filter(b => 
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase())
    );

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.compositeScore - a.compositeScore;
        case "revenue":
          return parseFloat(b.estimatedRevenuePerHour || '0') - parseFloat(a.estimatedRevenuePerHour || '0');
        case "efficiency":
          return b.tokenEfficiency - a.tokenEfficiency;
        case "setup":
          return (a.setupTimeHours || 999) - (b.setupTimeHours || 999);
        default:
          return 0;
      }
    });

    return filtered;
  }, [businesses, search, sortBy]);

  const stats = useMemo(() => {
    if (!businesses) return { total: 0, prime: 0, stable: 0, experimental: 0 };
    return {
      total: businesses.length,
      prime: businesses.filter(b => b.scoreTier === 'prime').length,
      stable: businesses.filter(b => b.scoreTier === 'stable').length,
      experimental: businesses.filter(b => b.scoreTier === 'experimental').length,
    };
  }, [businesses]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Business Catalog</h1>
            <p className="text-muted-foreground">Discover and deploy autonomous micro-businesses</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <Star className="mr-1 h-3 w-3" />
              {stats.prime} Prime
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              {stats.stable} Stable
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              {stats.experimental} Experimental
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search businesses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <div className="flex gap-3">
                <Select value={vertical} onValueChange={setVertical}>
                  <SelectTrigger className="w-[180px] bg-secondary border-border">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERTICALS.map(v => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] bg-secondary border-border">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Highest Score</SelectItem>
                    <SelectItem value="revenue">Highest Revenue</SelectItem>
                    <SelectItem value="efficiency">Token Efficiency</SelectItem>
                    <SelectItem value="setup">Fastest Setup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="bg-card border-border">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map(business => (
              <BusinessCard 
                key={business.id} 
                business={business as Business}
                onDeploy={() => deployBusiness.mutate({ businessId: business.id })}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-white mb-2">No businesses found</p>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
