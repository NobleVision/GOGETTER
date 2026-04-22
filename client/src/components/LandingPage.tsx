import { Fragment, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion, useInView, useReducedMotion, type Variants } from "framer-motion";
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
  ArrowUpRight,
  BadgeDollarSign,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Crown,
  Flame,
  Gem,
  Globe,
  Layers3,
  Linkedin,
  Loader2,
  Lock,
  Newspaper,
  Orbit,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Youtube,
  Zap,
} from "lucide-react";

interface LandingPageProps {
  errorMessage?: string | null;
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type SocialLink = {
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
};

const SOCIAL_LINKS: SocialLink[] = [
  { label: "X (formerly Twitter)", href: "https://x.com/gogetteros/", Icon: XLogo },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/gogetteros/", Icon: (p) => <Linkedin {...p} /> },
  { label: "YouTube", href: "https://www.youtube.com/@GoGetterOS", Icon: (p) => <Youtube {...p} /> },
];

const COMMERCIAL_YOUTUBE_ID = "5b_3TDAXyUE";

const COMMERCIAL_TIMESTAMPS: { time: string; label: string; seconds: number }[] = [
  { time: "00:00", label: "The Empty Stand", seconds: 0 },
  { time: "00:15", label: "Emma Runs to Grandpa in Tears", seconds: 15 },
  { time: "00:30", label: "Grandpa Discovers GoGetterOS", seconds: 30 },
  { time: "00:45", label: "One Call Changes Everything", seconds: 45 },
  { time: "01:00", label: "Lines Around the Corner!", seconds: 60 },
  { time: "01:15", label: "Be a Go-Getter", seconds: 75 },
];

const COMMERCIAL_POSTS = {
  x: "https://x.com/gogetteros/status/2046823036217688313",
  linkedin:
    "https://www.linkedin.com/posts/gogetteros_grandpa-uses-ai-to-save-his-granddaughter-ugcPost-7452593262407782401-nvDB",
};

type TypewriterTextProps = {
  text: string;
  className?: string;
  as?: "p" | "span" | "div";
  perChar?: number;
  startDelay?: number;
  reduceMotion?: boolean;
  shimmer?: boolean;
};

// Three-phase paragraph reveal:
//   hidden  -> typing (char-by-char motion spans)
//   typing  -> settled (swap to continuous text so kerning + anti-aliasing
//                       restore full weight; inline-block per-char rendering
//                       visually reads as "faded" even at opacity 1)
//   settled -> shimmer (slow repeating light sweep via mix-blend-mode, one
//                       pass every ~9s, purely decorative).
//
// Each char uses raw object props (not variant names), isolating it from
// any parent variant cascade. That isolation is load-bearing.
function TypewriterText({
  text,
  className,
  as = "p",
  perChar = 0.018,
  startDelay = 0,
  reduceMotion = false,
  shimmer = true,
}: TypewriterTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [settled, setSettled] = useState(reduceMotion);
  const Wrapper = as as "p" | "span" | "div";

  useEffect(() => {
    if (reduceMotion) {
      setSettled(true);
      return;
    }
    if (!inView) return;
    const totalMs = (startDelay + text.length * perChar + 0.5) * 1000;
    const timer = window.setTimeout(() => setSettled(true), totalMs);
    return () => window.clearTimeout(timer);
  }, [inView, reduceMotion, startDelay, text.length, perChar]);

  if (reduceMotion) {
    return <Wrapper className={className}>{text}</Wrapper>;
  }

  if (settled) {
    return (
      <Wrapper
        ref={ref as never}
        className={`${className ?? ""} relative overflow-hidden`}
        style={{ isolation: "isolate" }}
      >
        <span className="relative z-10">{text}</span>
        {shimmer ? (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-[45%] bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.0)_30%,rgba(255,255,255,0.42)_50%,rgba(255,255,255,0.0)_70%,transparent_100%)]"
            style={{ mixBlendMode: "screen" }}
            initial={{ x: "-120%" }}
            animate={{ x: "260%" }}
            transition={{
              duration: 2.2,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 7,
              delay: 0.2,
            }}
          />
        ) : null}
      </Wrapper>
    );
  }

  const words = text.split(" ");
  let charCounter = 0;

  return (
    <Wrapper
      ref={ref as never}
      className={className}
      aria-label={text}
    >
      {words.map((word, wi) => {
        const chars = Array.from(word);
        return (
          <span
            key={wi}
            aria-hidden="true"
            style={{ display: "inline-block", whiteSpace: "nowrap" }}
          >
            {chars.map((ch) => {
              const i = charCounter++;
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={inView ? { opacity: 1, y: 0 } : undefined}
                  transition={{
                    delay: startDelay + i * perChar,
                    type: "spring",
                    stiffness: 260,
                    damping: 24,
                    mass: 0.6,
                  }}
                  style={{ display: "inline-block" }}
                >
                  {ch}
                </motion.span>
              );
            })}
            {wi < words.length - 1 ? "\u00A0" : null}
          </span>
        );
      })}
    </Wrapper>
  );
}

type MaskRevealHeadingProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
  perWord?: number;
  reduceMotion?: boolean;
};

// Slide-and-settle heading reveal:
//   hidden  -> entering (per-word spring slide from y:30, fade from opacity:0,
//                        de-blur from blur(10px), staggered via `perWord`)
//   entering -> settled (swap to plain <Wrapper>{text}</Wrapper> so kerning
//                        returns and the text renders crisp at full weight;
//                        inline-block per-word wrappers dim the visual
//                        weight otherwise, matching the same bug we solved
//                        for TypewriterText)
//
// Isolated from parent variant cascade by using raw object props on each
// motion.span (not variant names).
function MaskRevealHeading({
  text,
  className,
  as = "h3",
  delay = 0,
  perWord = 0.06,
  reduceMotion = false,
}: MaskRevealHeadingProps) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const words = text.split(" ");
  const [settled, setSettled] = useState(reduceMotion);
  const Wrapper = as as "h1" | "h2" | "h3";

  useEffect(() => {
    if (reduceMotion) {
      setSettled(true);
      return;
    }
    if (!inView) return;
    // delay + last word's start + spring settle time (~0.9s for the chosen
    // stiffness/damping to reach rest within perceptual threshold).
    const totalMs = (delay + words.length * perWord + 0.95) * 1000;
    const timer = window.setTimeout(() => setSettled(true), totalMs);
    return () => window.clearTimeout(timer);
  }, [inView, reduceMotion, delay, perWord, words.length]);

  if (reduceMotion || settled) {
    return (
      <Wrapper ref={ref as never} className={className}>
        {text}
      </Wrapper>
    );
  }

  return (
    <Wrapper ref={ref as never} className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span
            aria-hidden="true"
            style={{ display: "inline-block", willChange: "transform, opacity, filter" }}
            initial={{ y: 30, opacity: 0, filter: "blur(10px)" }}
            animate={inView ? { y: 0, opacity: 1, filter: "blur(0px)" } : undefined}
            transition={{
              y: {
                type: "spring",
                damping: 16,
                stiffness: 130,
                mass: 0.85,
                delay: delay + i * perWord,
              },
              opacity: {
                duration: 0.45,
                ease: "easeOut",
                delay: delay + i * perWord,
              },
              filter: {
                duration: 0.55,
                ease: "easeOut",
                delay: delay + i * perWord,
              },
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </Wrapper>
  );
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

type LandingBlogPost = {
  id?: number;
  title: string;
  slug?: string;
  summary?: string | null;
  content?: string | null;
  category?: string | null;
  tags?: string[] | null;
  imageUrl?: string | null;
  publishedAt?: string | Date | null;
};

type LandingDailySignal = {
  title: string;
  whyContent: string;
  whoContent: string;
  marketContext?: string | null;
  sourceUrls?: string[] | null;
};

type LandingHotList = {
  title: string;
  summary?: string | null;
  entries?: Array<Record<string, any>> | null;
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

const DEFAULT_DAILY_SIGNAL: LandingDailySignal = {
  title: "Why now / who wins today",
  whyContent:
    "Lean teams, solo operators, and founders are under pressure to move faster with less capital. The best opportunities are no longer hidden in complexity; they are hidden in execution speed.",
  whoContent:
    "GoGetterOS fits builders who want AI-assisted business formation, monetization experiments, and a direct path from research to launch.",
  marketContext:
    "Teams that can move from signal to launch faster are outperforming larger but slower competitors.",
  sourceUrls: [],
};

const DEFAULT_HOT_LIST: LandingHotList = {
  title: "Hot 100 opportunities",
  summary: "Curated ideas GoGetterOS can help validate, prototype, and scale.",
  entries: [
    { rank: 1, title: "AI appointment-setting agencies for local service businesses" },
    { rank: 2, title: "Micro-SaaS audit tools for creators and consultants" },
    { rank: 3, title: "Voice-based customer recovery workflows for SMB sales teams" },
    { rank: 4, title: "Niche compliance dashboards with recurring reporting retainers" },
    { rank: 5, title: "Prompt-powered offer generators for coaches and experts" },
    { rank: 6, title: "Automated outbound systems for premium local operators" },
  ],
};

const DEFAULT_BLOG_POSTS: LandingBlogPost[] = [
  {
    title: "How GoGetterOS turns business discovery into an operating system",
    summary:
      "A look at how the platform converts research, validation, and monetization into a single execution path.",
    category: "Launch Strategy",
    tags: ["go-to-market", "ai ops"],
  },
  {
    title: "What to validate before paying for build-out and deployment",
    summary:
      "The highest-leverage questions to answer before committing real capital, code, and operational overhead.",
    category: "Validation",
    tags: ["validation", "pricing"],
  },
  {
    title: "Why AI-assisted operators are winning smaller markets faster",
    summary:
      "A premium positioning piece on why lean builders can now launch faster and monetize sooner than legacy teams.",
    category: "Market Signals",
    tags: ["opportunity", "automation"],
  },
];

function formatDate(value?: string | Date | null) {
  if (!value) return "Fresh insight";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Fresh insight";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function extractHotEntryTitle(entry: Record<string, any>) {
  return (
    entry?.title ??
    entry?.name ??
    entry?.opportunity ??
    entry?.label ??
    entry?.description ??
    "Untitled opportunity"
  );
}

export default function LandingPage({ errorMessage }: LandingPageProps) {
  const [, setLocation] = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!introOpen && introVideoRef.current) {
      introVideoRef.current.pause();
      introVideoRef.current.currentTime = 0;
    }
  }, [introOpen]);

  useEffect(() => {
    if (!introOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIntroOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [introOpen]);

  const plansQuery = trpc.subscription.plans.useQuery();
  const landingContentQuery = trpc.content.landingPage.useQuery();

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
    const preferredOrder: PricingTierKey[] = ["free", "launch_pass", "starter", "pro", "enterprise"];

    return tiers
      .filter((tier) => preferredOrder.includes(tier.key))
      .sort((a, b) => preferredOrder.indexOf(a.key) - preferredOrder.indexOf(b.key));
  }, [plansQuery.data]);

  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  const blogPosts = (landingContentQuery.data?.blogs?.length
    ? landingContentQuery.data.blogs
    : DEFAULT_BLOG_POSTS) as LandingBlogPost[];
  const dailySignal = (landingContentQuery.data?.dailySignal ?? DEFAULT_DAILY_SIGNAL) as LandingDailySignal;
  const hotList = (landingContentQuery.data?.hotList ?? DEFAULT_HOT_LIST) as LandingHotList;
  const hotEntries = Array.isArray(hotList.entries) && hotList.entries.length > 0 ? hotList.entries : DEFAULT_HOT_LIST.entries ?? [];

  const revealTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const };

  const springReveal = shouldReduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 130, damping: 20, mass: 0.7 } as const);

  const sectionStagger: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemFromBelow: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: springReveal },
  };

  const itemFromLeft: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: springReveal },
  };

  const itemFromRight: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: springReveal },
  };

  // Final CTA entrance: zoom-pop with spring physics (0.8 -> overshoot -> 1),
  // then releases child stagger once the pop has settled. Under reduced
  // motion, falls back to a plain opacity fade with no scaling.
  const ctaZoomContainer: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, scale: 0.8 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: {
            scale: { type: "spring", stiffness: 260, damping: 20, mass: 0.9 },
            opacity: { duration: 0.45, ease: "easeOut" },
            staggerChildren: 0.12,
            delayChildren: 0.35,
          },
        },
      };

  const ctaZoomItem: Variants = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const hoverLift = shouldReduceMotion
    ? {}
    : {
        whileHover: {
          y: -12,
          scale: 1.018,
          rotateX: 7,
          rotateY: -7,
          filter: "brightness(1.06)",
        },
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
      };

  const foldBackStyle = shouldReduceMotion
    ? undefined
    : ({ transformPerspective: 1600 } as const);

  const sectionGlowMotion = shouldReduceMotion
    ? undefined
    : {
        opacity: [0.4, 0.72, 0.48, 0.4],
        scale: [1, 1.04, 0.99, 1],
      };

  const marqueeDrift = shouldReduceMotion
    ? undefined
    : {
        x: [0, 18, 0, -12, 0],
      };

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
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(168,85,247,0.16),transparent_22%),linear-gradient(to_bottom,rgba(2,6,23,0.7),rgba(2,6,23,0.96))]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.16]" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-28 h-72 w-72 rounded-full bg-emerald-500/18 blur-3xl"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.08, 0.98, 1], opacity: [0.35, 0.55, 0.42, 0.35] }}
        transition={shouldReduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-48 h-80 w-80 rounded-full bg-violet-500/14 blur-3xl"
        animate={shouldReduceMotion ? undefined : { y: [0, -24, 0], scale: [1, 1.05, 1] }}
        transition={shouldReduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="fixed right-4 top-4 z-50">
        <MediaControls showVolumeSlider />
      </div>

      <section className="relative border-b border-white/10 px-4 pb-20 pt-24 md:px-8">
        <motion.button
          type="button"
          onClick={() => setIntroOpen(true)}
          initial={shouldReduceMotion ? false : { opacity: 0, y: -10, scale: 0.96 }}
          animate={
            shouldReduceMotion
              ? { opacity: introOpen ? 0 : 1 }
              : { opacity: introOpen ? 0 : 1, y: 0, scale: introOpen ? 0.92 : 1 }
          }
          transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.35 }}
          whileHover={shouldReduceMotion || introOpen ? undefined : { scale: 1.04 }}
          whileTap={shouldReduceMotion || introOpen ? undefined : { scale: 0.97 }}
          aria-label="Watch the GoGetterOS intro video"
          aria-hidden={introOpen || undefined}
          tabIndex={introOpen ? -1 : 0}
          style={{ pointerEvents: introOpen ? "none" : "auto" }}
          className="group absolute right-4 top-20 z-30 aspect-[9/16] w-24 overflow-hidden rounded-2xl border border-emerald-500/25 bg-slate-950/70 shadow-[0_20px_60px_rgba(16,185,129,0.22),0_10px_40px_rgba(2,6,23,0.55)] backdrop-blur-xl transition-shadow hover:border-emerald-400/45 hover:shadow-[0_24px_70px_rgba(16,185,129,0.32),0_12px_50px_rgba(2,6,23,0.65)] md:right-10 md:top-24 md:w-32 lg:w-36"
        >
          <img
            src="/video-intros/GoGetterOS_Intro_poster.jpg"
            alt="Intro video preview — GoGetterOS founder"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="eager"
            decoding="async"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-[0_8px_24px_rgba(16,185,129,0.45)] ring-2 ring-white/30 transition-transform duration-300 group-hover:scale-110 md:h-12 md:w-12">
              <Play className="h-4 w-4 translate-x-[1px] fill-current md:h-5 md:w-5" />
            </span>
          </span>
          <span className="pointer-events-none absolute inset-x-0 bottom-0 px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white/90 md:text-[11px]">
            Watch intro · 1 min
          </span>
        </motion.button>

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={revealTransition}
            className="space-y-8 rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(2,6,23,0.62),rgba(15,23,42,0.38))] p-6 shadow-[0_24px_90px_rgba(2,6,23,0.42)] backdrop-blur-xl md:p-8"
          >
            <div className="flex items-center gap-3">
              <motion.img
                src="/logo-256x256.png"
                alt="GO-GETTER OS"
                className="h-14 w-14 rounded-2xl shadow-2xl shadow-emerald-500/30"
                animate={shouldReduceMotion ? undefined : { rotate: [0, -3, 0, 3, 0] }}
                transition={shouldReduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Monetized AI business operating system</p>
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  GO-GETTER <span className="text-emerald-400">OS</span>
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              <Badge className="border border-emerald-400/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20">
                From exploration to launch-ready revenue systems
              </Badge>
              <MaskRevealHeading
                as="h2"
                className="max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl"
                text="Build, price, validate, and scale AI-powered businesses with a premium path to revenue."
                delay={0.1}
                perWord={0.05}
                reduceMotion={!!shouldReduceMotion}
              />
              <TypewriterText
                as="p"
                className="max-w-3xl text-lg leading-8 text-slate-50 md:text-xl"
                text="GoGetterOS turns entrepreneurial ambition into a phased execution engine. Explore for free, unlock deeper layers when the signal is real, and move from discovery into monetized operations with more speed and less waste."
                startDelay={0.25}
                reduceMotion={!!shouldReduceMotion}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={handleSignIn}
                className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:via-teal-300 hover:to-cyan-300"
              >
                <span className="relative z-10 flex items-center">
                  Continue with Google
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowEmailForm(true)}
                className="border-white/15 bg-slate-900/60 text-slate-100 backdrop-blur hover:bg-slate-800"
              >
                Use email instead
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {PLATFORM_METRICS.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.08 + index * 0.06 }}
                  {...hoverLift}
                >
                  <Card className="group border-white/10 bg-[linear-gradient(145deg,rgba(2,6,23,0.86),rgba(15,23,42,0.72))] shadow-[0_16px_50px_rgba(2,6,23,0.32)] backdrop-blur transition-colors hover:border-emerald-400/24 hover:bg-slate-950/88">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300 shadow-lg shadow-emerald-500/10 transition-transform duration-300 group-hover:scale-110">
                        <metric.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xl font-semibold text-white">{metric.value}</div>
                        <div className="text-xs text-slate-100">{metric.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 22 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
            transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.12 }}
          >
            <Card className="relative overflow-hidden border-white/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.9),rgba(15,23,42,0.82))] shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-emerald-500/10 via-cyan-400/10 to-violet-500/10" />
              <CardHeader className="relative space-y-3">
                <Badge className="w-fit border border-violet-400/20 bg-violet-500/15 text-violet-100 hover:bg-violet-500/20">
                  Access the platform
                </Badge>
                <CardTitle className="text-2xl text-white">Start free. Upgrade when the model proves itself.</CardTitle>
                <CardDescription className="text-slate-50">
                  Explore the system with a free account, then unlock Launch Pass, Starter, or Pro when you are ready to move from concept to execution.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-5">
                {errorMessage ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{errorMessage}</div>
                ) : null}

                {!showEmailForm ? (
                  <div className="space-y-3">
                    <Button
                      onClick={handleSignIn}
                      className="h-12 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-base text-white hover:from-emerald-400 hover:via-teal-300 hover:to-cyan-300"
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
                          authMode === "signin" ? "bg-emerald-500/20 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Sign in
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode("signup")}
                        className={`flex-1 rounded-lg px-3 py-2 transition ${
                          authMode === "signup" ? "bg-emerald-500/20 text-white" : "text-slate-400 hover:text-white"
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
                      className="h-12 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-base text-white hover:from-emerald-400 hover:via-teal-300 hover:to-cyan-300"
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

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-50">
                  Free accounts can browse, run one discovery flow, and preview the monetized GoGetterOS experience before upgrading.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {introOpen && (
          <motion.div
            key="intro-pip"
            role="dialog"
            aria-modal="false"
            aria-label="GoGetterOS intro video"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -12 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: -10 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto fixed right-4 top-20 z-[60] w-36 origin-top-right overflow-hidden rounded-2xl border border-white/12 bg-slate-950/95 shadow-[0_30px_120px_rgba(2,6,23,0.65)] backdrop-blur-xl sm:w-[320px] md:right-8 md:top-24"
          >
            <button
              type="button"
              onClick={() => setIntroOpen(false)}
              aria-label="Close intro video"
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 text-white shadow-lg shadow-black/30 backdrop-blur transition-colors hover:border-emerald-400/40 hover:bg-slate-950/90"
            >
              <X className="h-4 w-4" />
            </button>
            <video
              ref={introVideoRef}
              controls
              autoPlay
              preload="auto"
              playsInline
              poster="/video-intros/GoGetterOS_Intro_poster.jpg"
              className="block aspect-[9/16] w-full bg-slate-950 object-cover"
            >
              <source src="/video-intros/GoGetterOS_Intro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.62),rgba(2,6,23,0.92))] px-4 py-20 md:px-8">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-[12%] top-16 h-64 w-64 rounded-full bg-emerald-500/14 blur-3xl"
          animate={shouldReduceMotion ? undefined : { y: [0, -18, 0], scale: [1, 1.05, 1] }}
          transition={shouldReduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[8%] bottom-10 h-56 w-56 rounded-full bg-violet-500/12 blur-3xl"
          animate={shouldReduceMotion ? undefined : { y: [0, 16, 0], scale: [1, 0.96, 1] }}
          transition={shouldReduceMotion ? undefined : { duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={revealTransition}
          className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-start"
        >
          <div className="flex flex-col gap-6">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.08 }}
              className="relative w-full overflow-hidden rounded-3xl border border-white/12 bg-slate-950/80 shadow-[0_30px_100px_rgba(2,6,23,0.55)]"
              style={{ paddingTop: "56.25%" }}
            >
              <iframe
                src={`https://www.youtube.com/embed/${COMMERCIAL_YOUTUBE_ID}`}
                title="Grandpa Uses AI to Save His Granddaughter's Lemonade Stand"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 h-full w-full"
              />
            </motion.div>
          </div>

          <div className="flex flex-col gap-6">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.04 }}
              className="space-y-4"
            >
              <Badge className="w-fit border border-violet-400/25 bg-violet-500/15 text-violet-100 hover:bg-violet-500/20">
                Featured story · Our first commercial
              </Badge>
              <MaskRevealHeading
                as="h3"
                className="text-3xl font-semibold leading-tight text-white md:text-4xl"
                text="Grandpa Uses AI to Save His Granddaughter's Lemonade Stand"
                delay={0.05}
                reduceMotion={!!shouldReduceMotion}
              />
              <TypewriterText
                as="p"
                className="max-w-2xl text-base leading-7 text-slate-50 md:text-lg"
                text="Little Emma's lemonade stand was failing — until her grandfather used AI to change everything. Watch how one simple call to GoGetterOS turned tears into lines around the corner."
                startDelay={0.2}
                reduceMotion={!!shouldReduceMotion}
              />
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.16 }}
              className="space-y-3"
            >
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-emerald-300/80">
                Jump to a moment
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {COMMERCIAL_TIMESTAMPS.map((stamp) => (
                  <a
                    key={stamp.seconds}
                    href={`https://youtu.be/${COMMERCIAL_YOUTUBE_ID}?t=${stamp.seconds}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-left text-sm text-slate-100 transition-colors hover:border-emerald-400/35 hover:bg-slate-950/82"
                  >
                    <span className="font-mono text-xs text-emerald-300 tabular-nums">{stamp.time}</span>
                    <span className="flex-1 truncate">{stamp.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-emerald-300" />
                  </a>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.22 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Also on</span>
              <a
                href={COMMERCIAL_POSTS.x}
                target="_blank"
                rel="noreferrer"
                aria-label="View this commercial on X"
                className="flex items-center gap-2 rounded-full border border-white/12 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-100 transition-colors hover:border-emerald-400/40 hover:bg-slate-950/85"
              >
                <XLogo className="h-3.5 w-3.5" />
                View on X
              </a>
              <a
                href={COMMERCIAL_POSTS.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label="View this commercial on LinkedIn"
                className="flex items-center gap-2 rounded-full border border-white/12 bg-slate-950/70 px-3 py-1.5 text-xs text-slate-100 transition-colors hover:border-emerald-400/40 hover:bg-slate-950/85"
              >
                <Linkedin className="h-3.5 w-3.5" />
                View on LinkedIn
              </a>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <motion.div
            initial={shouldReduceMotion ? false : "hidden"}
            whileInView={shouldReduceMotion ? undefined : "visible"}
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionStagger}
            className="max-w-3xl space-y-3 rounded-[28px] border border-white/10 bg-slate-950/72 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl md:p-8"
          >
            <motion.div variants={itemFromBelow}>
              <Badge className="border border-white/12 bg-white/10 text-slate-50 hover:bg-white/15">Core value proposition</Badge>
            </motion.div>
            <MaskRevealHeading
              as="h3"
              className="text-3xl font-semibold tracking-tight text-white md:text-4xl md:leading-tight"
              text="The platform is designed to convert curiosity into a structured revenue journey."
              delay={0.18}
              reduceMotion={!!shouldReduceMotion}
            />
            <TypewriterText
              as="p"
              className="text-lg leading-8 text-white"
              text="The landing page sells the promise, the account experience reveals the operating system, and the pricing model nudges users into increasingly serious execution only when the opportunity warrants it."
              startDelay={0.35}
              reduceMotion={!!shouldReduceMotion}
            />
          </motion.div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CORE_CAPABILITIES.map((item, index) => (
              <motion.div
                key={item.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : index * 0.06 }}
                {...hoverLift}
              >
                <Card className="group relative overflow-hidden border-white/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.9),rgba(15,23,42,0.76))] shadow-[0_18px_60px_rgba(2,6,23,0.32)] backdrop-blur-xl">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-violet-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <CardHeader>
                    <div className="w-fit rounded-xl bg-emerald-500/10 p-3 text-emerald-300 shadow-lg shadow-emerald-500/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-white">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-7 text-slate-100">{item.description}</CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.52),rgba(2,6,23,0.82))] px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={revealTransition}
            className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <motion.div
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView={shouldReduceMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.3 }}
              variants={sectionStagger}
              className="max-w-3xl space-y-3 rounded-[28px] border border-white/10 bg-slate-950/72 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl md:p-8"
            >
              <motion.div variants={itemFromLeft}>
                <Badge className="border border-violet-400/24 bg-violet-500/18 text-violet-50 hover:bg-violet-500/24">Phased monetization model</Badge>
              </motion.div>
              <MaskRevealHeading
                as="h3"
                className="text-3xl font-semibold tracking-tight text-white md:text-4xl md:leading-tight"
                text="Seven phases, one increasingly valuable path."
                delay={0.18}
                reduceMotion={!!shouldReduceMotion}
              />
              <TypewriterText
                as="p"
                className="text-lg leading-8 text-white"
                text="Users start with discovery and pay progressively deeper into the experience. High-touch deployment remains reserved for premium workflows and managed execution."
                startDelay={0.35}
                reduceMotion={!!shouldReduceMotion}
              />
            </motion.div>
            <Button
              variant="outline"
              className="border-white/12 bg-slate-900/80 text-white shadow-lg shadow-violet-500/5 hover:bg-slate-800"
              onClick={() => setLocation("/wizard")}
            >
              Preview the discovery flow
            </Button>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-7">
            {PHASES.map((phase, index) => (
              <motion.div
                key={phase.name}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : index * 0.04 }}
                {...hoverLift}
              >
                <Card className="border-white/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.9),rgba(15,23,42,0.78))] shadow-[0_18px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="border-white/15 text-slate-50">
                        Phase {index + 1}
                      </Badge>
                      <Flame className={`h-4 w-4 ${index < 4 ? "text-emerald-300" : "text-amber-300"}`} />
                    </div>
                    <CardTitle className="text-white">{phase.name}</CardTitle>
                    <CardDescription className="text-slate-100">{phase.label}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm leading-7 text-slate-100">{phase.description}</CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={revealTransition}
            className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <motion.div
              initial={shouldReduceMotion ? false : "hidden"}
              whileInView={shouldReduceMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.3 }}
              variants={sectionStagger}
              className="max-w-3xl space-y-3 rounded-[28px] border border-white/10 bg-slate-950/72 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl md:p-8"
            >
              <motion.div variants={itemFromRight}>
                <Badge className="border border-emerald-400/24 bg-emerald-500/18 text-emerald-50 hover:bg-emerald-500/24">Pricing that matches commitment</Badge>
              </motion.div>
              <MaskRevealHeading
                as="h3"
                className="text-3xl font-semibold tracking-tight text-white md:text-4xl md:leading-tight"
                text="Start free, launch with confidence, scale when the business earns it."
                delay={0.18}
                reduceMotion={!!shouldReduceMotion}
              />
              <TypewriterText
                as="p"
                className="text-lg leading-8 text-white"
                text="The pricing model is structured so the platform can monetize earlier without forcing every user into a high-ticket retainer on day one."
                startDelay={0.35}
                reduceMotion={!!shouldReduceMotion}
              />
            </motion.div>
            <div className="rounded-2xl border border-emerald-500/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(15,23,42,0.72))] px-4 py-3 text-sm text-slate-100 shadow-lg shadow-emerald-500/5 backdrop-blur-xl">
              {plansQuery.data?.stripeConfigured
                ? "Checkout is ready to connect to Stripe."
                : "Pricing is wired for checkout and can activate once Stripe keys are configured."}
            </div>
          </motion.div>

          <div className="grid gap-4 xl:grid-cols-5">
            {pricingTiers.map((tier, index) => {
              const featured = tier.key === "starter" || tier.key === "pro";
              const isEnterprise = tier.key === "enterprise";
              return (
                <motion.div
                  key={tier.key}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : index * 0.05 }}
                  {...hoverLift}
                >
                  <Card
                    className={`relative overflow-hidden border-white/12 ${
                      featured
                        ? "bg-[linear-gradient(160deg,rgba(16,185,129,0.18),rgba(15,23,42,0.96)_34%,rgba(15,23,42,0.9))] shadow-[0_24px_90px_rgba(16,185,129,0.14)]"
                        : "bg-[linear-gradient(145deg,rgba(2,6,23,0.9),rgba(15,23,42,0.78))] shadow-[0_18px_60px_rgba(2,6,23,0.28)]"
                    }`}
                  >
                    {featured ? <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400" /> : null}
                    <CardHeader className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-white/10 text-slate-50 capitalize">
                          {tier.name}
                        </Badge>
                        {tier.key === "pro" ? <Crown className="h-4 w-4 text-amber-300" /> : null}
                        {tier.key === "launch_pass" ? <Rocket className="h-4 w-4 text-emerald-300" /> : null}
                        {tier.key === "free" ? <Sparkles className="h-4 w-4 text-violet-300" /> : null}
                        {tier.key === "enterprise" ? <Gem className="h-4 w-4 text-cyan-300" /> : null}
                      </div>
                      <div>
                        <CardTitle className="text-white">{tier.name}</CardTitle>
                        <CardDescription className="mt-2 min-h-16 text-slate-100">{tier.description}</CardDescription>
                      </div>
                      <div>
                        <div className="text-4xl font-semibold text-white">
                          {isEnterprise ? "$10k+" : tier.price === 0 ? "$0" : `$${tier.price}`}
                        </div>
                        <div className="text-sm text-slate-100">
                          {tier.key === "launch_pass"
                            ? "one-time unlock"
                            : tier.key === "enterprise"
                              ? "managed monthly retainer"
                              : tier.price === 0
                                ? "start exploring"
                                : "per month"}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-100">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {tier.monthlyCredits.toLocaleString()} credits
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          {tier.activeBusinesses === 999999
                            ? "Unlimited active businesses"
                            : `${tier.activeBusinesses} active business${tier.activeBusinesses === 1 ? "" : "es"}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          {tier.wizardUses === 999999 ? "Unlimited discovery runs" : `${tier.wizardUses} discovery runs`}
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Token capacity: {tier.tokenRateLimit.toLocaleString()}
                        </div>
                      </div>
                      <Button
                        className={`w-full ${
                          featured
                            ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-white hover:from-emerald-400 hover:via-teal-300 hover:to-cyan-300"
                            : "bg-slate-800 text-white hover:bg-slate-700"
                        }`}
                        onClick={handleSignIn}
                      >
                        {tier.key === "free" ? "Start free" : isEnterprise ? "Talk to GoGetterOS" : `Choose ${tier.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.65),rgba(2,6,23,0.92))] px-4 py-16 md:px-8">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[10%] top-20 h-72 w-72 rounded-full bg-emerald-500/16 blur-3xl"
          animate={sectionGlowMotion}
          transition={shouldReduceMotion ? undefined : { duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-[12%] top-28 h-80 w-80 rounded-full bg-violet-500/14 blur-3xl"
          animate={shouldReduceMotion ? undefined : { opacity: [0.34, 0.6, 0.42, 0.34], y: [0, -10, 8, 0] }}
          transition={shouldReduceMotion ? undefined : { duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/72 p-6 shadow-[0_35px_120px_rgba(2,6,23,0.6)] backdrop-blur-xl md:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_22%)]" />
            <div className="relative space-y-8">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={revealTransition}
                className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-6 md:flex-row md:items-end md:justify-between"
              >
                <motion.div
                  initial={shouldReduceMotion ? false : "hidden"}
                  whileInView={shouldReduceMotion ? undefined : "visible"}
                  viewport={{ once: true, amount: 0.3 }}
                  variants={sectionStagger}
                  className="max-w-3xl space-y-3"
                >
                  <motion.div variants={itemFromBelow}>
                    <motion.div animate={marqueeDrift} transition={shouldReduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: "easeInOut" }}>
                      <Badge className="border border-cyan-400/30 bg-cyan-500/18 text-cyan-50 hover:bg-cyan-500/24">Editorial signal engine</Badge>
                    </motion.div>
                  </motion.div>
                  <MaskRevealHeading
                    as="h3"
                    className="max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.05]"
                    text="Why / Who, Hot 100, and Blog now work as a real landing-page intelligence layer."
                    delay={0.2}
                    perWord={0.05}
                    reduceMotion={!!shouldReduceMotion}
                  />
                  <TypewriterText
                    as="p"
                    className="max-w-3xl text-lg leading-8 text-slate-50"
                    text="These sections are now powered by the same content-management system used in the admin area, so your public narrative, trend positioning, and editorial content can evolve without hard-coded edits."
                    startDelay={0.35}
                    reduceMotion={!!shouldReduceMotion}
                  />
                </motion.div>
                <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-medium text-slate-100 shadow-lg shadow-emerald-500/5 backdrop-blur">
                  {landingContentQuery.isLoading ? "Syncing curated content…" : "Editorial content is live on the landing page."}
                </div>
              </motion.div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -70, rotateX: 8 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0, rotateX: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.02 }}
                  style={foldBackStyle}
                  {...hoverLift}
                >
                  <Card className="group relative overflow-hidden border-white/12 bg-slate-950/88 shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.26),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.22),transparent_28%)] opacity-95" />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_22%,transparent_70%,rgba(255,255,255,0.03))] opacity-70" />
                    <CardHeader className="relative space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge className="w-fit border border-amber-400/30 bg-amber-500/18 text-amber-50 hover:bg-amber-500/22">Why / Who</Badge>
                        <motion.div
                          animate={marqueeDrift}
                          transition={shouldReduceMotion ? undefined : { duration: 10, repeat: Infinity, ease: "easeInOut" }}
                          className="flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-slate-100 shadow-lg shadow-emerald-500/5"
                        >
                          <Orbit className="h-3.5 w-3.5 text-emerald-300" />
                          Narrative pulse
                        </motion.div>
                      </div>
                      <CardTitle className="text-2xl leading-tight text-white md:text-[2rem]">{dailySignal.title}</CardTitle>
                      <CardDescription className="text-base leading-7 text-slate-100">
                        Updated from the admin editorial workflow and positioned to explain market timing and audience fit in real time.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative grid gap-4 md:grid-cols-2">
                      <motion.div
                        whileHover={shouldReduceMotion ? undefined : { rotateX: -5, rotateY: 6, scale: 1.015 }}
                        transition={{ duration: 0.25 }}
                        style={foldBackStyle}
                        className="rounded-[24px] border border-emerald-400/18 bg-slate-900/86 p-5 shadow-[0_18px_60px_rgba(16,185,129,0.08)]"
                      >
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                          <TrendingUp className="h-4 w-4" /> Why now
                        </div>
                        <p className="text-sm leading-7 text-slate-100">{dailySignal.whyContent}</p>
                      </motion.div>
                      <motion.div
                        whileHover={shouldReduceMotion ? undefined : { rotateX: -5, rotateY: -6, scale: 1.015 }}
                        transition={{ duration: 0.25 }}
                        style={foldBackStyle}
                        className="rounded-[24px] border border-cyan-400/18 bg-slate-900/86 p-5 shadow-[0_18px_60px_rgba(34,211,238,0.08)]"
                      >
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                          <Users className="h-4 w-4" /> Who it serves
                        </div>
                        <p className="text-sm leading-7 text-slate-100">{dailySignal.whoContent}</p>
                      </motion.div>
                      {dailySignal.marketContext ? (
                        <motion.div
                          whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.01 }}
                          transition={{ duration: 0.25 }}
                          className="md:col-span-2 rounded-[24px] border border-violet-400/16 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.84))] p-5 text-sm leading-7 text-slate-100 shadow-[0_18px_60px_rgba(168,85,247,0.08)]"
                        >
                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-violet-100">
                            <Target className="h-4 w-4 text-violet-300" /> Market context
                          </div>
                          {dailySignal.marketContext}
                        </motion.div>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, x: 70, rotateX: 8 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0, rotateX: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : 0.08 }}
                  style={foldBackStyle}
                  {...hoverLift}
                >
                  <Card className="group relative overflow-hidden border-white/12 bg-slate-950/88 shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.22),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_30%)] opacity-95" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-rose-500/8 to-transparent" />
                    <CardHeader className="relative space-y-4">
                      <Badge className="w-fit border border-rose-400/30 bg-rose-500/18 text-rose-50 hover:bg-rose-500/22">Hot 100</Badge>
                      <CardTitle className="text-2xl leading-tight text-white md:text-[2rem]">{hotList.title}</CardTitle>
                      <CardDescription className="text-base leading-7 text-slate-100">
                        {hotList.summary || "Curated opportunity signals that create urgency, relevance, and premium positioning on the public site."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative space-y-3">
                      {hotEntries.slice(0, 6).map((entry, index) => (
                        <motion.div
                          key={`${extractHotEntryTitle(entry)}-${index}`}
                          className="flex items-start gap-3 rounded-[22px] border border-white/12 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.86))] p-4 text-sm text-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.35)]"
                          whileHover={shouldReduceMotion ? undefined : { x: 8, rotateX: -4, rotateY: 5, scale: 1.012 }}
                          transition={{ duration: 0.22 }}
                          style={foldBackStyle}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-300/16 bg-rose-500/14 font-semibold text-rose-100 shadow-lg shadow-rose-500/10">
                            {entry?.rank ?? index + 1}
                          </div>
                          <div className="space-y-1.5">
                            <div className="font-semibold leading-6 text-white">{extractHotEntryTitle(entry)}</div>
                            {entry?.description ? <div className="leading-6 text-slate-100">{String(entry.description)}</div> : null}
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={revealTransition}
                className="space-y-6"
              >
                <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-6 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-3xl space-y-3">
                    <Badge className="border border-emerald-400/30 bg-emerald-500/18 text-emerald-50 hover:bg-emerald-500/24">Blog</Badge>
                    <MaskRevealHeading
                      as="h3"
                      className="text-3xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.05]"
                      text="Editorial content that makes the monetization story feel real."
                      delay={0.1}
                      perWord={0.05}
                      reduceMotion={!!shouldReduceMotion}
                    />
                    <TypewriterText
                      as="p"
                      className="text-lg leading-8 text-slate-50"
                      text="Showcase launch strategy, validation logic, and market insight directly on the landing page so visitors see proof of thought leadership before they ever enter the product."
                      startDelay={0.25}
                      reduceMotion={!!shouldReduceMotion}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSignIn}
                    className="border-white/12 bg-slate-900/80 text-white shadow-lg shadow-emerald-500/5 hover:bg-slate-800"
                  >
                    Unlock the full operating system
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {blogPosts.slice(0, 3).map((post, index) => (
                    <motion.div
                      key={`${post.slug ?? post.title}-${index}`}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 32, x: index % 2 === 0 ? -38 : 38 }}
                      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0, x: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ ...revealTransition, delay: shouldReduceMotion ? 0 : index * 0.08 }}
                      style={foldBackStyle}
                      {...hoverLift}
                    >
                      <Card className="group relative h-full overflow-hidden border-white/12 bg-slate-950/90 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),transparent_26%,transparent_74%,rgba(34,211,238,0.1))] opacity-75 transition-opacity duration-500 group-hover:opacity-100" />
                        <motion.div
                          aria-hidden
                          className="pointer-events-none absolute -right-12 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"
                          animate={sectionGlowMotion}
                          transition={shouldReduceMotion ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <CardHeader className="relative space-y-4">
                          <div className="flex items-center justify-between gap-3 text-xs text-slate-100">
                            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                              <Newspaper className="h-3.5 w-3.5 text-emerald-300" />
                              <span>{post.category || "GoGetterOS insight"}</span>
                            </div>
                            <span>{formatDate(post.publishedAt)}</span>
                          </div>
                          <CardTitle className="text-xl leading-8 text-white">{post.title}</CardTitle>
                          <CardDescription className="min-h-24 text-sm leading-7 text-slate-100">
                            {post.summary || post.content || "Fresh editorial insight from the GoGetterOS launch engine."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="relative flex h-full flex-col justify-between gap-4">
                          <div className="flex flex-wrap gap-2">
                            {(post.tags ?? []).slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="border-white/12 bg-white/6 text-slate-100">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            onClick={handleSignIn}
                            className="-ml-4 justify-start text-emerald-200 hover:bg-transparent hover:text-white"
                          >
                            Read inside GoGetterOS
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView={shouldReduceMotion ? undefined : "visible"}
          viewport={{ once: true, amount: 0.2 }}
          variants={ctaZoomContainer}
          style={{ transformOrigin: "50% 50%" }}
          className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-slate-950/82 p-8 shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur-xl"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <motion.div variants={ctaZoomItem}>
                <Badge className="border border-emerald-400/20 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20">Ready to start cooking?</Badge>
              </motion.div>
              <MaskRevealHeading
                as="h3"
                className="text-3xl font-semibold tracking-tight text-white md:text-4xl"
                text="Explore the OS for free, then pay when the opportunity earns a deeper commitment."
                delay={0.45}
                reduceMotion={!!shouldReduceMotion}
              />
              <TypewriterText
                as="p"
                className="max-w-3xl text-lg leading-8 text-emerald-50"
                text="The new experience is built to convert interest into action: clearer positioning, stronger pricing, live editorial sections, a visible path through the phases, and a billing layer that supports real monetization."
                startDelay={0.6}
                reduceMotion={!!shouldReduceMotion}
              />
              <motion.div variants={ctaZoomItem} className="flex flex-wrap gap-3 text-sm text-white">
                <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 shadow-lg shadow-black/10">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" /> Trusted sign-in and billing
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 shadow-lg shadow-black/10">
                  <BookOpen className="h-4 w-4 text-cyan-300" /> Curated insight and strategy content
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 shadow-lg shadow-black/10">
                  <TrendingUp className="h-4 w-4 text-violet-300" /> Opportunity-led growth path
                </div>
              </motion.div>
              <motion.div variants={ctaZoomItem} className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Follow along</span>
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-slate-950/70 text-slate-100 shadow-lg shadow-black/10 transition-colors hover:border-emerald-400/40 hover:bg-slate-950/85 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </motion.div>
            </div>
            <motion.div variants={ctaZoomItem} className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button
                size="lg"
                onClick={handleSignIn}
                className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-white shadow-[0_18px_60px_rgba(16,185,129,0.22)] hover:from-emerald-400 hover:via-teal-300 hover:to-cyan-300"
              >
                Create free account
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowEmailForm(true)}
                className="border-white/12 bg-slate-900/70 text-white shadow-lg shadow-black/10 hover:bg-slate-800"
              >
                Use email instead
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/70 px-4 py-10 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-256x256.png"
              alt="GO-GETTER OS"
              className="h-10 w-10 rounded-xl shadow-lg shadow-emerald-500/20"
            />
            <div>
              <p className="text-sm font-semibold text-white">GO-GETTER OS</p>
              <p className="text-xs text-slate-400">Monetized AI business operating system</p>
            </div>
          </div>
          <nav aria-label="Social" className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-slate-950/70 text-slate-100 transition-colors hover:border-emerald-400/40 hover:bg-slate-950/85 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </nav>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} GoGetterOS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
