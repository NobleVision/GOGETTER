import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  Cpu,
  Crown,
  DollarSign,
  Rocket,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";

type SubscriptionTierKey = "free" | "launch_pass" | "starter" | "pro" | "enterprise" | "unlimited";

type PlanRecord = {
  key: SubscriptionTierKey;
  name: string;
  price: number;
  monthlyCredits: number;
  activeBusinesses: number;
  wizardUses: number;
  tokenRateLimit: number;
  description: string;
};

const WORKFLOW_STEPS = [
  {
    title: "Discover",
    description: "Run the AI-guided discovery flow and identify the best business direction for your goals.",
    cta: "Start discovery",
    path: "/wizard",
    icon: Sparkles,
  },
  {
    title: "Evaluate",
    description: "Compare opportunities, catalog entries, and operational assumptions before committing spend.",
    cta: "Browse catalog",
    path: "/catalog",
    icon: Cpu,
  },
  {
    title: "Operate",
    description: "Monitor businesses, usage, and live interventions once the concept is active.",
    cta: "View businesses",
    path: "/my-businesses",
    icon: Rocket,
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const protectedQueryEnabled = Boolean(user) && !authLoading;

  const { data: stats, isLoading: statsQueryLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: protectedQueryEnabled,
  });
  const { data: userBusinesses, isLoading: businessesQueryLoading } = trpc.userBusinesses.list.useQuery(undefined, {
    enabled: protectedQueryEnabled,
  });
  const { data: interventions } = trpc.events.pendingInterventions.useQuery(undefined, {
    enabled: protectedQueryEnabled,
  });
  const { data: subscription, isLoading: subscriptionQueryLoading, refetch: refetchSubscription } = trpc.subscription.get.useQuery(undefined, {
    enabled: protectedQueryEnabled,
  });
  const { data: plansData } = trpc.subscription.plans.useQuery(undefined, {
    enabled: protectedQueryEnabled,
  });
  const { data: creditHistory } = trpc.subscription.creditHistory.useQuery(undefined, {
    enabled: protectedQueryEnabled,
  });

  const statsLoading = authLoading || statsQueryLoading;
  const businessesLoading = authLoading || businessesQueryLoading;
  const subscriptionLoading = authLoading || subscriptionQueryLoading;

  const checkoutMutation = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.success("Checkout session created.");
    },
    onError: (error) => toast.error(error.message),
  });

  const portalMutation = trpc.subscription.createBillingPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.success("Billing portal opened.");
    },
    onError: (error) => toast.error(error.message),
  });

  const topUpMutation = trpc.subscription.createCreditTopUpSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.success("Credit top-up checkout created.");
    },
    onError: (error) => toast.error(error.message),
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(num) ? num : 0);
  };

  const planMap = useMemo(() => {
    const entries = (plansData?.tiers ?? []) as PlanRecord[];
    return Object.fromEntries(entries.map((entry) => [entry.key, entry]));
  }, [plansData?.tiers]);

  const currentPlan = subscription ? planMap[subscription.tier as SubscriptionTierKey] : undefined;
  const remainingWizardUses = subscription
    ? Math.max(0, subscription.wizardUsesLimit - subscription.wizardUsesThisMonth)
    : 0;
  const creditsRemaining = subscription?.creditsRemaining ?? 0;
  const upgradeTargets = ["launch_pass", "starter", "pro"] as const;

  const beginCheckout = (plan: "launch_pass" | "starter" | "pro") => {
    checkoutMutation.mutate({
      plan,
      successUrl: `${window.location.origin}/?billing=success`,
      cancelUrl: `${window.location.origin}/?billing=cancelled`,
    });
  };

  const openBillingPortal = () => {
    portalMutation.mutate({
      returnUrl: `${window.location.origin}/`,
    });
  };

  const beginTopUp = () => {
    topUpMutation.mutate({
      amountUsd: 49,
      credits: 100,
      successUrl: `${window.location.origin}/?billing=topup-success`,
      cancelUrl: `${window.location.origin}/?billing=topup-cancelled`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20">
                    Your business operating system
                  </Badge>
                  <CardTitle className="mt-3 text-3xl text-white">Welcome back to GoGetterOS</CardTitle>
                  <CardDescription className="mt-2 max-w-2xl text-base text-slate-300">
                    Monitor performance, keep your credits and plan aligned with your goals, and move from idea discovery into operating businesses with a clearer monetized workflow.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/catalog")}
                    className="border-white/10 bg-slate-900/60 text-white hover:bg-slate-800"
                  >
                    Browse catalog
                  </Button>
                  <Button
                    onClick={() => setLocation("/wizard")}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Start discovery
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {WORKFLOW_STEPS.map((step) => (
                <button
                  key={step.title}
                  onClick={() => setLocation(step.path)}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-left transition hover:border-emerald-500/30 hover:bg-slate-900"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="text-lg font-semibold text-white">{step.title}</div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{step.description}</p>
                  <div className="mt-4 inline-flex items-center text-sm text-emerald-300">
                    {step.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/80">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Badge className="bg-violet-500/15 text-violet-200 hover:bg-violet-500/20">
                    Subscription and credits
                  </Badge>
                  <CardTitle className="mt-3 text-white">Current access</CardTitle>
                  <CardDescription className="text-slate-300">
                    Your plan controls discovery volume, credits, and how many businesses you can actively operate.
                  </CardDescription>
                </div>
                {currentPlan?.key === "pro" || currentPlan?.key === "enterprise" ? (
                  <Crown className="h-5 w-5 text-amber-300" />
                ) : (
                  <Wallet className="h-5 w-5 text-emerald-300" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {subscriptionLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-28 w-full" />
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-slate-400">Current plan</div>
                        <div className="text-2xl font-semibold text-white">
                          {currentPlan?.name ?? subscription?.tier ?? "Free"}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 capitalize">
                        {subscription?.status ?? "active"}
                      </Badge>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Credits</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{creditsRemaining}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Discovery runs left</div>
                        <div className="mt-2 text-2xl font-semibold text-white">{remainingWizardUses}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-slate-950/80 p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Business cap</div>
                        <div className="mt-2 text-2xl font-semibold text-white">
                          {currentPlan?.activeBusinesses === 999999 ? "∞" : currentPlan?.activeBusinesses ?? 0}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button
                        onClick={openBillingPortal}
                        variant="outline"
                        className="border-white/10 bg-slate-950 text-white hover:bg-slate-800"
                        disabled={portalMutation.isPending}
                      >
                        Manage billing
                      </Button>
                      <Button
                        onClick={beginTopUp}
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-400 hover:to-fuchsia-400"
                        disabled={topUpMutation.isPending}
                      >
                        Buy 100 credits
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-slate-300">Suggested upgrades</div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {upgradeTargets.map((targetKey) => {
                        const tier = planMap[targetKey];
                        if (!tier) return null;
                        const isCurrent = subscription?.tier === targetKey;
                        return (
                          <div key={targetKey} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-base font-semibold text-white">{tier.name}</div>
                              {isCurrent ? (
                                <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20">Current</Badge>
                              ) : null}
                            </div>
                            <div className="mt-2 text-sm text-slate-400">
                              {targetKey === "launch_pass" ? `$${tier.price} one-time` : `$${tier.price}/month`}
                            </div>
                            <p className="mt-3 text-sm leading-7 text-slate-300">{tier.description}</p>
                            <Button
                              className="mt-4 w-full bg-slate-800 text-white hover:bg-slate-700"
                              disabled={isCurrent || checkoutMutation.isPending}
                              onClick={() => beginCheckout(targetKey)}
                            >
                              {isCurrent ? "Already active" : `Choose ${tier.name}`}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Businesses</CardTitle>
              <Rocket className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20" /> : (
                <>
                  <div className="text-2xl font-bold text-white">{stats?.activeBusinesses || 0}</div>
                  <p className="text-xs text-slate-400">of {stats?.totalBusinesses || 0} deployed</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-2xl font-bold text-white">{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" /> All-time earnings
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Token Costs</CardTitle>
              <Cpu className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className="text-2xl font-bold text-white">{formatCurrency(stats?.totalTokenCost || 0)}</div>
                  <div className="flex items-center text-xs text-slate-400">
                    <TrendingDown className="mr-1 h-3 w-3" /> Total AI costs
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Net Profit</CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-24" /> : (
                <>
                  <div className={`text-2xl font-bold ${parseFloat(stats?.netProfit || "0") >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {formatCurrency(stats?.netProfit || 0)}
                  </div>
                  <div className="flex items-center text-xs text-slate-400">{stats?.profitMargin}% margin</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent billing and credit activity</CardTitle>
                <CardDescription className="text-slate-300">Keep an eye on credits, subscription changes, and monetization-related usage.</CardDescription>
              </div>
              <Coins className="h-5 w-5 text-violet-300" />
            </CardHeader>
            <CardContent>
              {creditHistory && creditHistory.length > 0 ? (
                <div className="space-y-3">
                  {creditHistory.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <div>
                        <div className="text-sm font-medium text-white">{entry.description || entry.reason}</div>
                        <div className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${entry.amount >= 0 ? "text-emerald-300" : "text-amber-300"}`}>
                          {entry.amount >= 0 ? "+" : ""}{entry.amount} credits
                        </div>
                        <div className="text-xs text-slate-400">Balance {entry.balanceAfter ?? creditsRemaining}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-8 text-center">
                  <CircleDollarSign className="mx-auto h-10 w-10 text-slate-500" />
                  <p className="mt-3 text-sm text-slate-300">No credit transactions yet. Your next upgrade or top-up will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Businesses and interventions</CardTitle>
                <CardDescription className="text-slate-300">Track recent launches, activity, and anything that needs your attention.</CardDescription>
              </div>
              {interventions && interventions.length > 0 ? (
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300">
                  {interventions.length} pending
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  All clear
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {interventions && interventions.length > 0 ? (
                <div className="space-y-3">
                  {interventions.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{item.message || "Intervention needed"}</p>
                        <p className="text-xs text-slate-400">Business #{item.userBusinessId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-300" />
                  <p className="mt-3 text-sm text-slate-300">No interventions are waiting for you right now.</p>
                </div>
              )}

              <div className="space-y-3">
                {businessesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : userBusinesses && userBusinesses.length > 0 ? (
                  userBusinesses.slice(0, 5).map((ub) => (
                    <button
                      key={ub.id}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-left transition hover:border-emerald-500/30 hover:bg-slate-900"
                      onClick={() => setLocation(`/monitoring?id=${ub.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                          ub.status === "running"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : ub.status === "paused"
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-slate-700 text-slate-300"
                        }`}>
                          <Rocket className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{ub.business.name}</div>
                          <div className="text-sm capitalize text-slate-400">{ub.status}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-emerald-300">{formatCurrency(ub.totalRevenue || 0)}</div>
                        <div className="text-sm text-slate-400">{ub.activeAgents} agents</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-8 text-center">
                    <Bot className="mx-auto h-10 w-10 text-slate-500" />
                    <p className="mt-3 text-sm text-slate-300">No businesses deployed yet. Start with discovery or browse the catalog to pick your first opportunity.</p>
                    <Button
                      onClick={() => setLocation("/catalog")}
                      className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400"
                    >
                      Browse business catalog
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
