import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGoogleLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import MediaControls from "./MediaControls";
import {
  ArrowRight,
  BadgeDollarSign,
  Bot,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Cpu,
  Crown,
  Flame,
  Gem,
  Globe,
  Layers3,
  Loader2,
  Lock,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

interface LandingPageProps {
  errorMessage?: string | null;
}

type PricingTierKey = "free" | "launch_pass" | "starter" | "pro" | "enterprise" | "unlimited";

type PricingTier = {
  key: PricingTierKey;
  name: string;
  price: number;
  monthlyCredits: number;
  activeBusinesses: number;
  wizardUses: number;
  tokenRateLimit: number;
  description: string;
};

const PLATFORM_METRICS = [
  { label: "Phases to monetize", value: "7", icon: Layers3 },
  { label: "Credits in free exploration", value: "10", icon: Zap },
  { label: "Active businesses in Pro", value: "5", icon: Briefcase },
  { label: "AI workflow coverage", value: "24/7", icon: Bot },
];

const CORE_CAPABILITIES = [
  {
    title: "Discover demand before you build",
    description:
      "GoGetterOS ranks business ideas, pressure-tests assumptions, and turns opportunity research into a phased launch path.",
    icon: Brain,
  },
  {
    title: "Prompt your way to progress",
    description:
      "Every phase is assisted by AI prompts, structured recommendations, and reusable workflows so users can move faster with less guesswork.",
    icon: Sparkles,
  },
  {
    title: "Upgrade only when traction appears",
    description:
      "The free and starter paths keep exploration affordable, while Launch Pass and Pro unlock the serious execution layers when needed.",
    icon: BadgeDollarSign,
  },
  {
    title: "Transition from ideas to operating systems",
    description:
      "The experience shifts from landing-page inspiration to an OS-style workspace built for deployment, monitoring, and scale.",
    icon: Cpu,
  },
];

const PHASES = [
  {
    name: "Genesis",
    label: "Get in",
    description: "Create an account, explore the system, and orient around your business goals.",
  },
  {
    name: "Spark",
    label: "Find the fit",
    description: "Discover the business model, niche, or workflow most aligned to your time, capital, and risk profile.",
  },
  {
    name: "Blueprint",
    label: "Model the path",
    description: "Generate plans, prompts, offers, architecture, and early commercialization assumptions.",
  },
  {
    name: "Prototype",
    label: "Make it real",
    description: "Create a hosted MVP, refine it with AI, and validate the offer before heavier investment.",
  },
  {
    name: "Momentum",
    label: "Retainer tier",
    description: "Reserved for higher-touch deployment, optimization, and managed execution workflows.",
  },
  {
    name: "Deploy",
    label: "Operational launch",
    description: "Push the winning concept into a production environment with real infrastructure and controls.",
  },
  {
    name: "Hero",
    label: "Compounding autonomy",
    description: "Graduate into a durable, operating business with scalable AI support and governance.",
  },
];

const DAILY_SIGNAL = {
  title: "Why now / who wins today",
  why: "Lean teams, solo operators, and founders are under pressure to move faster with less capital. The best opportunities are no longer hidden in complexity; they are hidden in execution speed.",
  who: "GoGetterOS fits builders who want AI-assisted business formation, monetization experiments, and a direct path from research to launch.",
};

const HOT_OPPORTUNITIES = [
  "AI appointment-setting agencies for local service businesses",
  "Micro-SaaS audit tools for creators and consultants",
  "Voice-based customer recovery workflows for SMB sales teams",
  "Niche compliance dashboards with recurring reporting retainers",
  "Prompt-powered offer generators for coaches and experts",
];

export default function LandingPage({ errorMessage }: LandingPageProps) {
  const [, setLocation] = useLocation();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const plansQuery = trpc.subscription.plans.useQuery();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.requiresVerification) {
        sessionStorage.setItem("verify_email", data.email);
        setLocation("/verify-email");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.requiresVerification && "email" in data && data.email) {
        sessionStorage.setItem("verify_email", data.email as string);
        setLocation("/verify-email");
        return;
      }
      window.location.href = "/";
    },
    onError: (err) => toast.error(err.message),
  });

  const pricingTiers = useMemo(() => {
    const tiers = (plansQuery.data?.tiers ?? []) as PricingTier[];
    const preferredOrder: PricingTierKey[] = [
      "free",
      "launch_pass",
      "starter",
      "pro",
      "enterprise",
    ];

    return tiers
      .filter((tier) => preferredOrder.includes(tier.key))
      .sort(
        (a, b) =>
          preferredOrder.indexOf(a.key) - preferredOrder.indexOf(b.key),
      );
  }, [plansQuery.data]);

  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  const handleSignIn = () => {
    window.location.href = getGoogleLoginUrl();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === "signup") {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }

      registerMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      return;
    }

    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#123a32_0%,rgba(15,23,42,0.92)_32%,#020617_75%)] text-white">
      <div className="fixed right-4 top-4 z-50">
        <MediaControls showVolumeSlider />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(16,185,129,0.12),transparent_35%,rgba(15,23,42,0.3))] pointer-events-none" />

      <section className="relative border-b border-white/10 px-4 pb-20 pt-24 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <img
                src="/logo-256x256.png"
                alt="GO-GETTER OS"
                className="h-14 w-14 rounded-2xl shadow-2xl shadow-emerald-500/30"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
                  Monetized AI business operating system
                </p>
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  GO-GETTER <span className="text-emerald-400">OS</span>
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20">
                From exploration to launch-ready revenue systems
              </Badge>
              <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                Build, test, price, and scale AI-powered businesses with a clearer path to revenue.
              </h2>
              <p className="max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                GoGetterOS turns entrepreneurial ambition into a phased operating system. Users can explore for free, pay when momentum appears, and graduate into high-touch execution only when a concept proves worthy.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={handleSignIn}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400"
              >
                Continue with Google
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowEmailForm(true)}
                className="border-white/15 bg-slate-900/60 text-slate-100 hover:bg-slate-800"
              >
                Use email instead
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {PLATFORM_METRICS.map((metric) => (
                <Card key={metric.label} className="border-white/10 bg-slate-950/60 backdrop-blur">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300">
                      <metric.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-white">{metric.value}</div>
                      <div className="text-xs text-slate-400">{metric.label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border-white/10 bg-slate-950/75 shadow-2xl shadow-black/30 backdrop-blur">
            <CardHeader className="space-y-3">
              <Badge className="w-fit bg-violet-500/15 text-violet-200 hover:bg-violet-500/20">
                Access the platform
              </Badge>
              <CardTitle className="text-2xl text-white">
                Start free. Upgrade when the model proves itself.
              </CardTitle>
              <CardDescription className="text-slate-300">
                Explore the system with a free account, then unlock Launch Pass, Starter, or Pro when you are ready to move from concept to execution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {errorMessage ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {errorMessage}
                </div>
              ) : null}

              {!showEmailForm ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleSignIn}
                    className="h-12 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base text-white hover:from-emerald-400 hover:to-teal-400"
                  >
                    Continue with Google
                  </Button>
                  <Button
                    onClick={() => setShowEmailForm(true)}
                    variant="outline"
                    className="h-12 w-full border-white/10 bg-slate-900/60 text-slate-100 hover:bg-slate-800"
                  >
                    Continue with email
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleEmailSubmit}>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-900/80 p-1 text-sm">
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className={`flex-1 rounded-lg px-3 py-2 transition ${
                        authMode === "signin"
                          ? "bg-emerald-500/20 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className={`flex-1 rounded-lg px-3 py-2 transition ${
                        authMode === "signup"
                          ? "bg-emerald-500/20 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Create account
                    </button>
                  </div>

                  {authMode === "signup" ? (
                    <div className="space-y-2">
                      <Label htmlFor="landing-name">Full name</Label>
                      <Input
                        id="landing-name"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="border-white/10 bg-slate-900/70"
                        placeholder="Your name"
                        required
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="landing-email">Email</Label>
                    <Input
                      id="landing-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="border-white/10 bg-slate-900/70"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="landing-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="landing-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        className="border-white/10 bg-slate-900/70 pr-11"
                        placeholder="Minimum 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <Lock className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 rotate-90" />}
                      </button>
                    </div>
                  </div>

                  {authMode === "signup" ? (
                    <div className="space-y-2">
                      <Label htmlFor="landing-confirm-password">Confirm password</Label>
                      <Input
                        id="landing-confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        className="border-white/10 bg-slate-900/70"
                        placeholder="Repeat your password"
                        required
                      />
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="h-12 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-base text-white hover:from-emerald-400 hover:to-teal-400"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {authMode === "signup" ? "Create my account" : "Sign in"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-sm text-slate-400 transition hover:text-white"
                  >
                    Back to Google sign-in options
                  </button>
                </form>
              )}

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-slate-200">
                Free accounts can browse, run one discovery flow, and preview the monetized GoGetterOS experience before upgrading.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="max-w-3xl space-y-3">
            <Badge className="bg-white/10 text-slate-200 hover:bg-white/15">Core value proposition</Badge>
            <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
              The platform is designed to convert curiosity into a structured revenue journey.
            </h3>
            <p className="text-lg leading-8 text-slate-300">
              The landing page sells the promise, the account experience reveals the operating system, and the pricing model nudges users into increasingly serious execution only when the opportunity warrants it.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CORE_CAPABILITIES.map((item) => (
              <Card key={item.title} className="border-white/10 bg-slate-950/60">
                <CardHeader>
                  <div className="w-fit rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-white">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-slate-300">
                  {item.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/40 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge className="bg-violet-500/15 text-violet-200 hover:bg-violet-500/20">Phased monetization model</Badge>
              <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">Seven phases, one increasingly valuable path.</h3>
              <p className="text-lg leading-8 text-slate-300">
                Users start with discovery and pay progressively deeper into the experience. High-touch deployment remains reserved for premium workflows and managed execution.
              </p>
            </div>
            <Button
              variant="outline"
              className="border-white/10 bg-slate-900/70 text-white hover:bg-slate-800"
              onClick={() => setLocation("/wizard")}
            >
              Preview the discovery flow
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-7">
            {PHASES.map((phase, index) => (
              <Card key={phase.name} className="border-white/10 bg-slate-950/70">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-white/15 text-slate-200">
                      Phase {index + 1}
                    </Badge>
                    <Flame className={`h-4 w-4 ${index < 4 ? "text-emerald-300" : "text-amber-300"}`} />
                  </div>
                  <CardTitle className="text-white">{phase.name}</CardTitle>
                  <CardDescription className="text-slate-400">{phase.label}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-slate-300">{phase.description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20">Pricing that matches commitment</Badge>
              <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">Start free, launch with confidence, scale when the business earns it.</h3>
              <p className="text-lg leading-8 text-slate-300">
                The pricing model is structured so the platform can monetize earlier without forcing every user into a high-ticket retainer on day one.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-slate-200">
              {plansQuery.data?.stripeConfigured ? "Checkout is ready to connect to Stripe." : "Pricing is wired for checkout and can activate once Stripe keys are configured."}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            {pricingTiers.map((tier) => {
              const featured = tier.key === "starter" || tier.key === "pro";
              const isEnterprise = tier.key === "enterprise";
              return (
                <Card
                  key={tier.key}
                  className={`relative overflow-hidden border-white/10 ${featured ? "bg-gradient-to-b from-emerald-500/10 to-slate-950/80 shadow-lg shadow-emerald-500/10" : "bg-slate-950/70"}`}
                >
                  {featured ? (
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                  ) : null}
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-white/10 text-slate-200 capitalize">
                        {tier.name}
                      </Badge>
                      {tier.key === "pro" ? <Crown className="h-4 w-4 text-amber-300" /> : null}
                      {tier.key === "launch_pass" ? <Rocket className="h-4 w-4 text-emerald-300" /> : null}
                      {tier.key === "free" ? <Sparkles className="h-4 w-4 text-violet-300" /> : null}
                      {tier.key === "enterprise" ? <Gem className="h-4 w-4 text-cyan-300" /> : null}
                    </div>
                    <div>
                      <CardTitle className="text-white">{tier.name}</CardTitle>
                      <CardDescription className="mt-2 min-h-16 text-slate-300">{tier.description}</CardDescription>
                    </div>
                    <div>
                      <div className="text-4xl font-semibold text-white">
                        {isEnterprise ? "$10k+" : tier.price === 0 ? "$0" : `$${tier.price}`}
                      </div>
                      <div className="text-sm text-slate-400">
                        {tier.key === "launch_pass" ? "one-time unlock" : tier.key === "enterprise" ? "managed monthly retainer" : tier.price === 0 ? "start exploring" : "per month"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-200">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {tier.monthlyCredits.toLocaleString()} credits</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {tier.activeBusinesses === 999999 ? "Unlimited active businesses" : `${tier.activeBusinesses} active business${tier.activeBusinesses === 1 ? "" : "es"}`}</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {tier.wizardUses === 999999 ? "Unlimited discovery runs" : `${tier.wizardUses} discovery runs`}</div>
                      <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> Token capacity: {tier.tokenRateLimit.toLocaleString()}</div>
                    </div>
                    <Button
                      className={`w-full ${featured ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400" : "bg-slate-800 text-white hover:bg-slate-700"}`}
                      onClick={handleSignIn}
                    >
                      {tier.key === "free" ? "Start free" : isEnterprise ? "Talk to GoGetterOS" : `Choose ${tier.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/40 px-4 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader>
              <Badge className="w-fit bg-amber-500/15 text-amber-200 hover:bg-amber-500/20">Daily narrative engine</Badge>
              <CardTitle className="text-white">{DAILY_SIGNAL.title}</CardTitle>
              <CardDescription className="text-slate-300">
                This area is designed to become a dynamic Why/Who section driven by scheduled content generation and admin curation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-300">
                  <TrendingUp className="h-4 w-4" /> Why now
                </div>
                <p className="text-sm leading-7 text-slate-300">{DAILY_SIGNAL.why}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-cyan-300">
                  <Globe className="h-4 w-4" /> Who it serves
                </div>
                <p className="text-sm leading-7 text-slate-300">{DAILY_SIGNAL.who}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-950/70">
            <CardHeader>
              <Badge className="w-fit bg-rose-500/15 text-rose-200 hover:bg-rose-500/20">Top opportunities</Badge>
              <CardTitle className="text-white">Hot business opportunities to showcase</CardTitle>
              <CardDescription className="text-slate-300">
                This panel is prepared for the dynamic Hot 100 / Top 10 content layer the admin tools will manage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {HOT_OPPORTUNITIES.map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 font-semibold text-rose-200">
                    {index + 1}
                  </div>
                  <div className="leading-7">{item}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950 to-slate-900 p-8 shadow-2xl shadow-black/20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20">Ready to start cooking?</Badge>
              <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Explore the OS for free, then pay when the opportunity earns a deeper commitment.
              </h3>
              <p className="max-w-3xl text-lg leading-8 text-slate-300">
                The new experience is built to convert interest into action: clearer positioning, stronger pricing, a visible path through the phases, and a billing layer that supports real monetization.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button
                size="lg"
                onClick={handleSignIn}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400"
              >
                Create free account
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowEmailForm(true)}
                className="border-white/10 bg-slate-900/60 text-white hover:bg-slate-800"
              >
                Use email instead
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
