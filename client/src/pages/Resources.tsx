import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  CreditCard, 
  Shield, 
  ExternalLink,
  Wallet,
  FileText,
  Globe,
  Zap,
  DollarSign,
  Users,
  BookOpen
} from "lucide-react";

const ENTITY_SERVICES = [
  {
    name: "Stripe Atlas",
    description: "Form a Delaware C-Corp with banking, tax ID, and legal docs in one package",
    url: "https://stripe.com/atlas",
    features: ["Delaware C-Corp", "Bank Account", "Tax ID", "Legal Templates"],
    price: "$500 one-time",
    recommended: true,
  },
  {
    name: "LegalZoom",
    description: "LLC and Corporation formation with registered agent services",
    url: "https://www.legalzoom.com",
    features: ["LLC Formation", "Corporation", "Registered Agent", "Operating Agreement"],
    price: "From $99",
  },
  {
    name: "Firstbase",
    description: "US company formation for international founders",
    url: "https://firstbase.io",
    features: ["Delaware LLC/Corp", "EIN", "Bank Account", "Mail Forwarding"],
    price: "From $399",
  },
  {
    name: "Clerky",
    description: "Startup-focused legal automation for Delaware corps",
    url: "https://www.clerky.com",
    features: ["Delaware C-Corp", "SAFE Notes", "Equity Plans", "Board Consents"],
    price: "From $799",
  },
];

const BANKING_SERVICES = [
  {
    name: "Mercury",
    description: "Banking for startups with powerful integrations and no fees",
    url: "https://mercury.com",
    features: ["No Monthly Fees", "API Access", "Virtual Cards", "Treasury"],
    recommended: true,
  },
  {
    name: "Revolut Business",
    description: "Multi-currency business accounts with crypto support",
    url: "https://www.revolut.com/business",
    features: ["Multi-Currency", "Crypto", "International Transfers", "Expense Management"],
  },
  {
    name: "Brex",
    description: "Corporate cards and spend management for startups",
    url: "https://www.brex.com",
    features: ["Corporate Cards", "Expense Management", "Rewards", "No Personal Guarantee"],
  },
  {
    name: "Relay",
    description: "No-fee business banking with profit-first features",
    url: "https://www.relayfi.com",
    features: ["No Fees", "Multiple Accounts", "Profit First", "Integrations"],
  },
];

const CRYPTO_SERVICES = [
  {
    name: "Circle (USDC)",
    description: "Enterprise-grade stablecoin infrastructure",
    url: "https://www.circle.com",
    features: ["USDC", "API Access", "Compliance", "Multi-chain"],
  },
  {
    name: "Coinbase Commerce",
    description: "Accept crypto payments with instant conversion",
    url: "https://commerce.coinbase.com",
    features: ["Multi-coin", "Instant Conversion", "No Fees", "API"],
  },
  {
    name: "Request Finance",
    description: "Crypto invoicing and payroll for DAOs and businesses",
    url: "https://www.request.finance",
    features: ["Invoicing", "Payroll", "Multi-chain", "Accounting"],
  },
];

const LEARNING_RESOURCES = [
  {
    name: "AI Agent Documentation",
    description: "Learn how to build and deploy autonomous AI agents",
    url: "#",
    icon: BookOpen,
  },
  {
    name: "Token Optimization Guide",
    description: "Best practices for minimizing AI model costs",
    url: "#",
    icon: Zap,
  },
  {
    name: "Business Compliance",
    description: "Legal considerations for AI-powered businesses",
    url: "#",
    icon: Shield,
  },
];

export default function Resources() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Resources</h1>
          <p className="text-muted-foreground">Tools and services to support your autonomous business operations</p>
        </div>

        {/* Entity Formation */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Entity Formation</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {ENTITY_SERVICES.map((service) => (
              <Card key={service.name} className={`bg-card border-border ${service.recommended ? 'ring-1 ring-emerald-500/50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        {service.name}
                        {service.recommended && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            Recommended
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{service.price}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(service.url, '_blank')}
                      className="border-border"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Banking */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">Business Banking</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {BANKING_SERVICES.map((service) => (
              <Card key={service.name} className={`bg-card border-border ${service.recommended ? 'ring-1 ring-blue-500/50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        {service.name}
                        {service.recommended && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                            Recommended
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{service.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(service.url, '_blank')}
                      className="border-border"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Crypto & Stablecoins */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Crypto & Stablecoins</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {CRYPTO_SERVICES.map((service) => (
              <Card key={service.name} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(service.url, '_blank')}
                    className="w-full border-border"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="flex items-start gap-4 p-4">
            <Shield className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <p className="font-medium text-white">Important Considerations</p>
              <p className="text-sm text-muted-foreground mt-1">
                Running autonomous AI businesses may have legal and tax implications. We recommend consulting with a qualified attorney and accountant before deploying revenue-generating agents. Entity formation provides liability protection and enables proper tax treatment of your AI business income.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Learning Resources */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Learning Resources</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {LEARNING_RESOURCES.map((resource) => {
              const Icon = resource.icon;
              return (
                <Card key={resource.name} className="bg-card border-border hover:border-emerald-500/30 transition-colors cursor-pointer">
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{resource.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
