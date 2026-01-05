import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useSearch } from "wouter";
import { 
  Activity, 
  DollarSign, 
  Cpu, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const EVENT_STYLES = {
  revenue: { icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  cost: { icon: Cpu, color: "text-amber-400", bg: "bg-amber-500/10" },
  error: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  intervention: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
  status_change: { icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
  agent_activity: { icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10" },
};

export default function Monitoring() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const selectedIdParam = params.get('id');
  
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | undefined>(
    selectedIdParam || undefined
  );

  const { data: userBusinesses, isLoading: businessesLoading } = trpc.userBusinesses.list.useQuery();
  const { data: selectedBusiness } = trpc.userBusinesses.get.useQuery(
    { id: parseInt(selectedBusinessId || '0') },
    { enabled: !!selectedBusinessId }
  );
  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = trpc.events.list.useQuery(
    { userBusinessId: parseInt(selectedBusinessId || '0'), limit: 50 },
    { enabled: !!selectedBusinessId }
  );
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const formatCurrency = (value: string | number | null) => {
    if (!value) return '$0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Mock chart data - in production this would come from real metrics
  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      revenue: Math.random() * 10 + 2,
      cost: Math.random() * 2 + 0.5,
    }));
    return hours;
  }, [selectedBusinessId]);

  const profit = selectedBusiness 
    ? parseFloat(selectedBusiness.totalRevenue || '0') - parseFloat(selectedBusiness.totalTokenCost || '0') - parseFloat(selectedBusiness.totalInfraCost || '0')
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Real-time Monitoring</h1>
            <p className="text-muted-foreground">Track your business performance and agent activity</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-[280px] bg-secondary border-border">
                <SelectValue placeholder="Select a business" />
              </SelectTrigger>
              <SelectContent>
                {userBusinesses?.map(ub => (
                  <SelectItem key={ub.id} value={ub.id.toString()}>
                    {ub.business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetchEvents()}
              className="border-border"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {selectedBusiness ? (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(selectedBusiness.totalRevenue)}
                  </div>
                  <div className="flex items-center text-xs text-emerald-400 mt-1">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {formatCurrency(selectedBusiness.dailyRevenue)}/day
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Token Costs</CardTitle>
                  <Cpu className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-400">
                    {formatCurrency(selectedBusiness.totalTokenCost)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    {formatCurrency(selectedBusiness.dailyTokenCost)}/day
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(profit)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedBusiness.totalRevenue && parseFloat(selectedBusiness.totalRevenue) > 0
                      ? `${((profit / parseFloat(selectedBusiness.totalRevenue)) * 100).toFixed(1)}% margin`
                      : '0% margin'
                    }
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Agents</CardTitle>
                  <Activity className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">
                    {selectedBusiness.activeAgents || 0}
                  </div>
                  <div className="flex items-center text-xs mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        selectedBusiness.status === 'running' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {selectedBusiness.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Over Time</CardTitle>
                  <CardDescription>Hourly revenue for the last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#9ca3af' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10b981" 
                          fill="url(#revenueGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-white">Cost Analysis</CardTitle>
                  <CardDescription>Token costs over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: '#9ca3af' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="cost" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Log */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white">Event Log</CardTitle>
                <CardDescription>Recent business events and agent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {eventsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : events && events.length > 0 ? (
                    <div className="space-y-3">
                      {events.map((event, idx) => {
                        const style = EVENT_STYLES[event.eventType as keyof typeof EVENT_STYLES] || EVENT_STYLES.agent_activity;
                        const Icon = style.icon;
                        return (
                          <div 
                            key={idx}
                            className={`flex items-start gap-4 p-4 rounded-lg ${style.bg} border border-border/50`}
                          >
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-background`}>
                              <Icon className={`h-4 w-4 ${style.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`font-medium capitalize ${style.color}`}>
                                  {event.eventType.replace('_', ' ')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(event.timestamp)}
                                </span>
                              </div>
                              {event.message && (
                                <p className="text-sm text-muted-foreground mt-1">{event.message}</p>
                              )}
                              {event.amount && (
                                <p className="text-sm font-medium text-white mt-1">
                                  {formatCurrency(event.amount)}
                                </p>
                              )}
                              {event.requiresIntervention && !event.resolved && (
                                <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-400 border-amber-500/30">
                                  Requires Attention
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No events recorded yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Events will appear here as your business runs</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Activity className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Business</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Choose a business from the dropdown above to view real-time monitoring data and event logs.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
