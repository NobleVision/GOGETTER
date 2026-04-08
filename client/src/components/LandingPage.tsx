import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGoogleLoginUrl } from "@/const";
import MediaControls from "./MediaControls";
import {
  Rocket,
  Bot,
  TrendingUp,
  Shield,
  BarChart3,
  Clock,
  DollarSign,
  ChevronDown,
  Sparkles,
  Activity,
  Cpu,
  Users,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  Target,
  Brain,
} from "lucide-react";

interface LandingPageProps {
  errorMessage?: string | null;
}

const VERTICALS = [
  {
    name: "Content & Media",
    icon: Sparkles,
    color: "text-purple-400",
    description: "Automated content creation, curation, and distribution across platforms"
  },
  {
    name: "Digital Services",
    icon: Cpu,
    color: "text-blue-400",
    description: "AI-powered service delivery and automated customer support"
  },
  {
    name: "E-commerce",
    icon: DollarSign,
    color: "text-emerald-400",
    description: "Automated product sourcing, listing, and fulfillment coordination"
  },
  {
    name: "Data & Insights",
    icon: BarChart3,
    color: "text-amber-400",
    description: "Information processing, analysis, and premium reporting services"
  },
];

const FEATURES = [
  {
    icon: Bot,
    title: "Intelligent Discovery",
    description: "Our AI wizard captures your risk tolerance, capital, and goals to create a personalized entrepreneurial profile and find perfect matches.",
  },
  {
    icon: TrendingUp,
    title: "Risk-Adjusted Scoring",
    description: "7-factor composite scoring: guaranteed demand (20%), automation level (15%), token efficiency (15%), profit margin (15%), and more.",
  },
  {
    icon: Clock,
    title: "Autonomous Execution",
    description: "Once deployed, AI agents handle day-to-day operations including customer acquisition, service delivery, and quality control.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Monitoring",
    description: "Live dashboards track performance metrics, identify optimization opportunities, and automatically adjust strategies.",
  },
  {
    icon: Brain,
    title: "Multi-Model Intelligence",
    description: "Combines OpenAI, Anthropic, Gemini, Perplexity, Grok, and Manus—automatically selecting the best model for each task.",
  },
  {
    icon: Shield,
    title: "Continuous Optimization",
    description: "Predictive analytics forecast performance, identify opportunities, and minimize risk before problems arise.",
  },
];

const PROBLEMS = [
  { icon: AlertTriangle, text: "Lack of business expertise—don't know what opportunities exist" },
  { icon: Clock, text: "Limited time and resources for research and execution" },
  { icon: Shield, text: "Risk aversion—fear of losing money on unproven ideas" },
  { icon: Cpu, text: "Technical complexity most people can't navigate" },
  { icon: Activity, text: "Even 'passive' income requires constant attention" },
];

const AUDIENCES = [
  {
    icon: Users,
    title: "Aspiring Entrepreneurs",
    points: [
      "Discover viable opportunities without extensive research",
      "Launch businesses without deep technical knowledge",
      "Reduce financial risk through intelligent scoring",
    ],
  },
  {
    icon: Briefcase,
    title: "Busy Professionals",
    points: [
      "Generate passive income that doesn't require attention",
      "Diversify income sources to reduce career risk",
      "Build wealth while maintaining primary career focus",
    ],
  },
  {
    icon: GraduationCap,
    title: "Experienced Business Owners",
    points: [
      "Identify new opportunities using AI-powered analysis",
      "Automate routine operations to focus on strategy",
      "Scale across multiple verticals simultaneously",
    ],
  },
];

const STATS = [
  { value: "20+", label: "Curated Opportunities" },
  { value: "7", label: "Scoring Factors" },
  { value: "6+", label: "AI Models Integrated" },
  { value: "24/7", label: "Autonomous Operation" },
];

export default function LandingPage({ errorMessage }: LandingPageProps) {
  const handleSignIn = () => {
    window.location.href = getGoogleLoginUrl();
  };

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen relative">
      {/* Fixed Media Controls */}
      <div className="fixed top-4 right-4 z-50">
        <MediaControls showVolumeSlider />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/90 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/logo-256x256.png" alt="GO-GETTER OS" className="h-16 w-16 rounded-2xl shadow-xl shadow-emerald-500/25" />
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              GO-GETTER <span className="text-emerald-400">OS</span>
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-emerald-400 font-semibold mb-4">
            Truly Passive Income Through AI-Powered Business Automation
          </p>

          {/* Executive Summary */}
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-4 leading-relaxed">
            A revolutionary platform that democratizes entrepreneurship by leveraging AI to identify,
            evaluate, and execute autonomous micro-business opportunities.
          </p>
          <p className="text-base text-slate-400 max-w-2xl mx-auto mb-8">
            In an era where traditional employment is uncertain and the gig economy demands constant involvement,
            GO-GETTER OS offers a third path: <span className="text-emerald-400 font-medium">autonomous income streams that work while you don't.</span>
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg max-w-md mx-auto backdrop-blur-sm">
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              onClick={handleSignIn}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg px-8 py-6 rounded-xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Get Started with Google
            </Button>
            <Button
              onClick={scrollToFeatures}
              variant="outline"
              size="lg"
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white text-lg px-8 py-6 rounded-xl"
            >
              Learn More
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <button
            onClick={scrollToFeatures}
            className="animate-bounce text-slate-500 hover:text-emerald-400 transition-colors"
            aria-label="Scroll to features"
          >
            <ChevronDown className="h-8 w-8" />
          </button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-20 px-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30">
              <Target className="h-3 w-3 mr-1" />
              The Problem
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Financial Independence Shouldn't Be This Hard
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Most people want financial freedom but face significant barriers that keep them stuck in the 9-to-5 grind.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {PROBLEMS.map((problem, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <problem.icon className="h-5 w-5 text-red-400 shrink-0" />
                <span className="text-sm text-slate-300">{problem.text}</span>
              </div>
            ))}
          </div>

          <div className="text-center p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/20">
            <p className="text-lg text-emerald-400 font-medium mb-2">Our Solution</p>
            <p className="text-slate-300">
              GO-GETTER OS transforms business development from a manual, risky, time-intensive process into an
              <span className="text-white font-medium"> automated, data-driven, and scalable system</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Verticals Section */}
      <section className="relative py-20 px-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              4 Industry Verticals
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Opportunities Across Key Markets
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Advanced algorithms analyze market data, competition, automation potential, and profitability
              to identify viable micro-business opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VERTICALS.map((vertical, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all group"
              >
                <vertical.icon className={`h-10 w-10 ${vertical.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h3 className="text-lg font-semibold text-white mb-2">{vertical.name}</h3>
                <p className="text-sm text-slate-400">{vertical.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-teal-500/20 text-teal-400 border-teal-500/30">
              <Rocket className="h-3 w-3 mr-1" />
              Core Capabilities
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              End-to-End Autonomous Business Platform
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From intelligent discovery through deployment to continuous optimization—GO-GETTER OS
              handles the entire lifecycle of your autonomous businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-teal-500/30 transition-all"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Activity className="h-3 w-3 mr-1" />
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              From Zero to Automated Revenue in 4 Steps
            </h2>
          </div>

          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Complete the Discovery Wizard",
                description: "Tell us about your risk tolerance, available capital, technical skills, and business goals. Our AI tailors recommendations just for you.",
              },
              {
                step: "02",
                title: "Explore Curated Opportunities",
                description: "Browse 20+ autonomous business opportunities, each with detailed scoring across 7 factors including demand, profit margins, and legal risk.",
              },
              {
                step: "03",
                title: "Deploy with One Click",
                description: "Choose your business, configure your AI models, and deploy. Our step-by-step blueprints and code templates make setup effortless.",
              },
              {
                step: "04",
                title: "Monitor & Scale",
                description: "Track real-time performance, revenue, and costs from your dashboard. Optimize, scale successful businesses, or pivot as needed.",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="relative py-20 px-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Users className="h-3 w-3 mr-1" />
              Who It's For
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for Builders at Every Stage
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Whether you're just starting out or scaling an empire, GO-GETTER OS meets you where you are.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {AUDIENCES.map((audience, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-blue-500/30 transition-all"
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-600/20 flex items-center justify-center mb-4">
                  <audience.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-4">{audience.title}</h3>
                <ul className="space-y-2">
                  {audience.points.map((point, j) => (
                    <li key={j} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 px-4 bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/logo-256x256.png" alt="GO-GETTER OS" className="h-20 w-20 rounded-2xl mx-auto mb-8 shadow-xl shadow-emerald-500/25" />

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            The Third Path to Financial Independence
          </h2>
          <p className="text-lg text-slate-400 mb-4 max-w-xl mx-auto">
            Not a corporate ladder. Not a side hustle that demands your time.
          </p>
          <p className="text-lg text-emerald-400 font-medium mb-8">
            Truly autonomous income through AI-powered business automation.
          </p>

          <Button
            onClick={handleSignIn}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg px-10 py-6 rounded-xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Start Building Your Autonomous Future
          </Button>

          <p className="text-sm text-slate-500 mt-6">
            Free to explore. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo-64x64.png" alt="GO-GETTER OS" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-white">GO-GETTER OS</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} NobleVision. Autonomous business development powered by AI.
          </p>
        </div>
      </footer>
    </div>
  );
}

