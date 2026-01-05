import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useMemo } from "react";

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
  const { data: usageHistory, isLoading: historyLoading } = trpc.tokenUsage.history.useQuery({ limit: 100 });
  const { data: summary, isLoading: summaryLoading } = trpc.tokenUsage.summary.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();

  const formatCurrency = (value: string | number | null) => {
    if (!value) return '$0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Calculate usage by model
  const usageByModel = useMemo(() => {
    if (!usageHistory) return [];
    
    const modelMap = new Map<string, { cost: number; tokens: number }>();
    usageHistory.forEach(usage => {
      const key = usage.modelName || 'Unknown';
      const existing = modelMap.get(key) || { cost: 0, tokens: 0 };
      modelMap.set(key, {
        cost: existing.cost + parseFloat(usage.totalCost || '0'),
        tokens: existing.tokens + (usage.inputTokens || 0) + (usage.outputTokens || 0),
      });
    });

    return Array.from(modelMap.entries()).map(([name, data]) => ({
      name,
      cost: data.cost,
      tokens: data.tokens,
      color: MODEL_COLORS[name] || MODEL_COLORS.default,
    })).sort((a, b) => b.cost - a.cost);
  }, [usageHistory]);

  // Calculate daily usage for chart
  const dailyUsage = useMemo(() => {
    if (!usageHistory) return [];
    
    const dayMap = new Map<string, number>();
    usageHistory.forEach(usage => {
      const day = new Date(usage.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dayMap.get(day) || 0;
      dayMap.set(day, existing + parseFloat(usage.totalCost || '0'));
    });

    return Array.from(dayMap.entries())
      .map(([day, cost]) => ({ day, cost }))
      .slice(-7)
      .reverse();
  }, [usageHistory]);

  const monthlyBudget = parseFloat(profile?.monthlyTokenBudget ?? '100');
  const totalCost = parseFloat(summary?.totalCost || '0');
  const budgetUsed = (totalCost / monthlyBudget) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Token Usage</h1>
          <p className="text-muted-foreground">Monitor AI model costs and optimize token efficiency</p>
        </div>

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
          {/* Cost by Model */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Cost by Model</CardTitle>
              <CardDescription>Token spending distribution across AI models</CardDescription>
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

          {/* Daily Spending */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-white">Daily Spending</CardTitle>
              <CardDescription>Token costs over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyUsage.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyUsage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No daily data yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
      </div>
    </DashboardLayout>
  );
}
