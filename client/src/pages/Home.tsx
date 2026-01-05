import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Cpu, 
  Activity, 
  Zap,
  ArrowRight,
  Rocket,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: userBusinesses, isLoading: businessesLoading } = trpc.userBusinesses.list.useQuery();
  const { data: interventions } = trpc.events.pendingInterventions.useQuery();

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-muted-foreground">Monitor your autonomous business empire</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/catalog')}
              className="border-border hover:bg-accent"
            >
              Browse Catalog
            </Button>
            <Button 
              onClick={() => setLocation('/wizard')}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
            >
              <Zap className="mr-2 h-4 w-4" />
              Start Discovery
            </Button>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Businesses</CardTitle>
              <Rocket className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{stats?.activeBusinesses || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    of {stats?.totalBusinesses || 0} deployed
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    All time earnings
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Token Costs</CardTitle>
              <Cpu className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{formatCurrency(stats?.totalTokenCost || 0)}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingDown className="mr-1 h-3 w-3" />
                    Total AI costs
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${parseFloat(stats?.netProfit || '0') >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(stats?.netProfit || 0)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {stats?.profitMargin}% margin
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Agents & Interventions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Active Agents</CardTitle>
                <CardDescription>AI agents currently running</CardDescription>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {stats?.activeAgents || 0} Online
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/30 flex items-center justify-center animate-pulse">
                      <Cpu className="h-8 w-8 text-emerald-400" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 animate-ping" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                {stats?.activeAgents ? 'Agents are processing tasks 24/7' : 'Deploy a business to start agents'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Interventions Required</CardTitle>
                <CardDescription>Issues needing your attention</CardDescription>
              </div>
              {interventions && interventions.length > 0 ? (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  {interventions.length} Pending
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  All Clear
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {interventions && interventions.length > 0 ? (
                <div className="space-y-3">
                  {interventions.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{item.message || 'Intervention needed'}</p>
                        <p className="text-xs text-muted-foreground">Business #{item.userBusinessId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
                  <p className="text-sm text-muted-foreground">No issues requiring attention</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Businesses */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Your Businesses</CardTitle>
              <CardDescription>Recently deployed autonomous businesses</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation('/my-businesses')} className="text-emerald-400 hover:text-emerald-300">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {businessesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : userBusinesses && userBusinesses.length > 0 ? (
              <div className="space-y-3">
                {userBusinesses.slice(0, 5).map((ub) => (
                  <div 
                    key={ub.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                    onClick={() => setLocation(`/monitoring?id=${ub.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        ub.status === 'running' ? 'bg-emerald-500/20' : 
                        ub.status === 'paused' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                      }`}>
                        <Rocket className={`h-5 w-5 ${
                          ub.status === 'running' ? 'text-emerald-400' : 
                          ub.status === 'paused' ? 'text-amber-400' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{ub.business.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{ub.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-emerald-400">{formatCurrency(ub.totalRevenue || 0)}</p>
                      <p className="text-sm text-muted-foreground">{ub.activeAgents} agents</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No businesses deployed yet</p>
                <Button onClick={() => setLocation('/catalog')} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                  Browse Business Catalog
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
