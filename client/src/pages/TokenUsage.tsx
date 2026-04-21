import AccessRestricted from "@/components/AccessRestricted";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, useReducedMotion } from "framer-motion";
import { interiorPageMotion } from "@/lib/interiorMotion";
import { usePermissions } from "@/_core/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Cpu, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Area, AreaChart } from "recharts";
import { useMemo, useState } from "react";

const MODEL_COLORS: Record<string, string> = {
  'gpt-4o': '#10b981',
  'gpt-4o-mini': '#34d399',
  'claude-3-opus': '#8b5cf6',
  'claude-3-sonnet': '#a78bfa',
  'claude-3-haiku': '#c4b5fd',
  'gemini-pro': '#3b82f6',
  'gemini-flash': '#60a5fa',
  'perplexity': '#f59e0b',
  'grok': '#ef4444',
  'default': '#6b7280',
};

export default function TokenUsage() {
  const { can } = usePermissions();
  if (!can("tokenUsage")) {
    return (
      <DashboardLayout>
        <AccessRestricted featureName="Token Usage" />
      </DashboardLayout>
    );
  }
  return <TokenUsageContent />;
}

function TokenUsageContent() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { data: usageHistory, isLoading: historyLoading } = trpc.tokenUsage.history.useQuery({ limit: 100 });
  const { data: summary, isLoading: summaryLoading } = trpc.tokenUsage.summary.useQuery();
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = trpc.tokenUsage.timeSeries.useQuery({
    timeRange,
    grouping: timeRange === '7d' ? 'day' : timeRange === '30d' ? 'day' : 'week'
  });
  const { data: profile } = trpc.profile.get.useQuery();

  const formatCurrency = (value: string | number | null) => {
    if (!value) return '$0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Calculate usage by model from time-series data
  const usageByModel = useMemo(() => {
    if (!timeSeriesData?.byProvider) return [];
    
    const modelMap = new Map<string, { cost: number; tokens: number }>();
    timeSeriesData.byProvider.forEach(usage => {
      const key = usage.modelProvider || 'Unknown';
      const existing = modelMap.get(key) || { cost: 0, tokens: 0 };
      modelMap.set(key, {
        cost: existing.cost + usage.totalCost,
        tokens: existing.tokens + usage.inputTokens + usage.outputTokens,
      });
    });

    return Array.from(modelMap.entries()).map(([name, data]) => ({
      name,
      cost: data.cost,
      tokens: data.tokens,
      color: MODEL_COLORS[name] || MODEL_COLORS.default,
    })).sort((a, b) => b.cost - a.cost);
  }, [timeSeriesData]);

  // Process time-series data for charts
  const chartData = useMemo(() => {
    if (!timeSeriesData?.total) return [];

    return timeSeriesData.total.map(point => ({
      time: formatChartTime(point.timestamp, timeRange),
      cost: point.totalCost,
      inputTokens: point.inputTokens,
      outputTokens: point.outputTokens,
      totalTokens: point.inputTokens + point.outputTokens,
    }));
  }, [timeSeriesData, timeRange]);

  // Process provider breakdown for stacked chart
  const providerChartData = useMemo(() => {
    if (!timeSeriesData?.byProvider) return [];

    const timeMap = new Map<string, Record<string, number>>();
    
    timeSeriesData.byProvider.forEach(point => {
      const timeKey = formatChartTime(point.timestamp, timeRange);
      const existing = timeMap.get(timeKey) || {};
      existing[point.modelProvider] = (existing[point.modelProvider] || 0) + point.totalCost;
      timeMap.set(timeKey, existing);
    });

    return Array.from(timeMap.entries()).map(([time, providers]) => ({
      time,
      ...providers,
    }));
  }, [timeSeriesData, timeRange]);

  const formatChartTime = (date: Date, range: string) => {
    if (range === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } else if (range === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const monthlyBudget = parseFloat(profile?.monthlyTokenBudget ?? '100');
  const totalCost = parseFloat(summary?.totalCost || '0');
  const budgetUsed = (totalCost / monthlyBudget) * 100;

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
            <h1 className="text-2xl font-bold text-white">Token Usage</h1>
            <p className="text-slate-300">Monitor AI model costs and optimize token efficiency</p>
          </div>
          <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
            <SelectTrigger className="w-[140px] bg-slate-900/70 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-amber-400">
                    {formatCurrency(summary?.totalCost ?? '0')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">All time token costs</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Input Tokens</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatNumber(summary?.totalInputTokens || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total input tokens used</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Output Tokens</CardTitle>
              <TrendingDown className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-purple-400">
                    {formatNumber(summary?.totalOutputTokens || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total output tokens generated</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budget Status</CardTitle>
              {budgetUsed > 80 ? (
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              ) : (
                <Zap className="h-4 w-4 text-emerald-400" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${budgetUsed > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {budgetUsed.toFixed(1)}%
              </div>
              <Progress value={Math.min(budgetUsed, 100)} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(totalCost)} of {formatCurrency(monthlyBudget)} budget
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Token Cost Trend */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Token Cost Trend</CardTitle>
              <CardDescription>
                {timeRange === '7d' ? 'Daily costs for the last 7 days' :
                 timeRange === '30d' ? 'Daily costs for the last 30 days' :
                 'Weekly costs for the last 90 days'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {timeSeriesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                        formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cost" 
                        stroke="#f59e0b" 
                        fill="url(#costGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No cost data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cost by Provider */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Cost by Provider</CardTitle>
              <CardDescription>Token spending breakdown by AI provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {timeSeriesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : providerChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={providerChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#9ca3af' }}
                        formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                      />
                      <Legend />
                      {Object.keys(MODEL_COLORS).filter(key => key !== 'default').map((provider, index) => (
                        <Bar 
                          key={provider}
                          dataKey={provider} 
                          stackId="cost"
                          fill={MODEL_COLORS[provider]}
                          radius={index === 0 ? [0, 0, 4, 4] : undefined}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No provider data available</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Warning */}
        {budgetUsed > 80 && (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
                <div>
                  <h3 className="font-semibold text-amber-400">Budget Warning</h3>
                  <p className="text-sm text-muted-foreground">
                    You've used {budgetUsed.toFixed(1)}% of your monthly token budget. 
                    Consider optimizing your AI usage or increasing your budget limit.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Model Distribution */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Model Distribution</CardTitle>
            <CardDescription>Token spending distribution across AI models for selected time period</CardDescription>
          </CardHeader>
          <CardContent>
            {usageByModel.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usageByModel}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="cost"
                        nameKey="name"
                      >
                        {usageByModel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {usageByModel.slice(0, 5).map((model, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: model.color }}
                        />
                        <span className="text-sm text-muted-foreground">{model.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{formatCurrency(model.cost)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No usage data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white">Usage History</CardTitle>
            <CardDescription>Recent token usage events</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : usageHistory && usageHistory.length > 0 ? (
                <div className="space-y-3">
                  {usageHistory.map((usage, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Cpu className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{usage.modelName}</span>
                            <Badge variant="outline" className="text-xs">
                              {usage.modelProvider}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(usage.inputTokens || 0)} in / {formatNumber(usage.outputTokens || 0)} out
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-amber-400">{formatCurrency(usage.totalCost)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(usage.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No token usage recorded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Usage will appear here as your businesses run</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
