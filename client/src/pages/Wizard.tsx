import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Compass,
  DollarSign,
  Target,
  Cpu,
  Rocket,
  Zap,
  Save,
  BookmarkPlus,
  Trash2
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Risk Tolerance", icon: Target },
  { id: 2, title: "Capital", icon: DollarSign },
  { id: 3, title: "Interests", icon: Compass },
  { id: 4, title: "Technical Skills", icon: Cpu },
  { id: 5, title: "Goals & Strategy", icon: Rocket },
];

const VERTICALS = [
  { id: "content_media", label: "Content & Media", description: "Newsletters, content syndication, stock photos" },
  { id: "digital_services", label: "Digital Services", description: "Customer support, code review, SaaS tools" },
  { id: "ecommerce", label: "E-commerce Automation", description: "Dropshipping, pricing, inventory" },
  { id: "data_insights", label: "Data & Insights", description: "Market research, competitive intelligence" },
];

const GOALS = [
  { id: "passive_income", label: "Passive Income", description: "Minimal involvement, steady returns" },
  { id: "scale_fast", label: "Scale Fast", description: "Aggressive growth, higher risk tolerance" },
  { id: "learn_ai", label: "Learn AI Business", description: "Educational focus, hands-on experience" },
  { id: "diversify", label: "Diversify Portfolio", description: "Multiple small businesses" },
  { id: "replace_income", label: "Replace Income", description: "Build towards full-time autonomous income" },
];

export default function Wizard() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [formData, setFormData] = useState({
    riskTolerance: "moderate" as "conservative" | "moderate" | "aggressive",
    capitalAvailable: "",
    interests: [] as string[],
    technicalSkills: "beginner" as "beginner" | "intermediate" | "advanced" | "expert",
    businessGoals: [] as string[],
    aggressiveness: "medium" as "low" | "medium" | "high",
    strategyTimeframe: "medium" as "short" | "medium" | "long",
    monthlyTokenBudget: "100",
  });

  // Preset queries and mutations
  const { data: presets = [], refetch: refetchPresets } = trpc.presets.list.useQuery();
  
  const createPreset = trpc.presets.create.useMutation({
    onSuccess: () => {
      toast.success("Preset saved successfully!");
      setShowSavePresetDialog(false);
      setPresetName("");
      refetchPresets();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save preset");
    }
  });

  const deletePreset = trpc.presets.delete.useMutation({
    onSuccess: () => {
      toast.success("Preset deleted successfully!");
      refetchPresets();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete preset");
    }
  });

  const upsertProfile = trpc.profile.upsert.useMutation({
    onSuccess: () => {
      toast.success("Profile saved! Redirecting to catalog...");
      setTimeout(() => setLocation('/catalog'), 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save profile");
    }
  });

  const progress = (step / STEPS.length) * 100;

  const handleNext = () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      // Submit
      upsertProfile.mutate({
        ...formData,
        wizardCompleted: true,
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleInterest = (id: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id) 
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const toggleGoal = (id: string) => {
    setFormData(prev => ({
      ...prev,
      businessGoals: prev.businessGoals.includes(id) 
        ? prev.businessGoals.filter(g => g !== id)
        : [...prev.businessGoals, id]
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Business Discovery Wizard</h1>
          <p className="text-muted-foreground mt-2">
            Let's find the perfect autonomous business opportunities for you
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Step {step} of {STEPS.length}</span>
            <span className="text-emerald-400">{STEPS[step - 1].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isComplete = s.id < step;
            return (
              <div 
                key={s.id} 
                className={`flex flex-col items-center gap-2 ${
                  isActive ? 'text-emerald-400' : isComplete ? 'text-emerald-400/60' : 'text-muted-foreground'
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-emerald-500/20 ring-2 ring-emerald-500' : 
                  isComplete ? 'bg-emerald-500/10' : 'bg-secondary'
                }`}>
                  {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className="text-xs hidden md:block">{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {(() => {
                const Icon = STEPS[step - 1].icon;
                return <Icon className="h-5 w-5 text-emerald-400" />;
              })()}
              {STEPS[step - 1].title}
            </CardTitle>
            <CardDescription>
              {step === 1 && "How much risk are you comfortable with?"}
              {step === 2 && "What's your available capital for starting businesses?"}
              {step === 3 && "Which business verticals interest you?"}
              {step === 4 && "What's your technical skill level?"}
              {step === 5 && "What are your business goals and strategy preferences?"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Risk Tolerance */}
            {step === 1 && (
              <RadioGroup 
                value={formData.riskTolerance} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, riskTolerance: v as any }))}
                className="space-y-3"
              >
                <div className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData.riskTolerance === 'conservative' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/50'
                }`}>
                  <RadioGroupItem value="conservative" id="conservative" />
                  <Label htmlFor="conservative" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">Conservative</div>
                    <div className="text-sm text-muted-foreground">Low risk, steady returns. Focus on proven business models.</div>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData.riskTolerance === 'moderate' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/50'
                }`}>
                  <RadioGroupItem value="moderate" id="moderate" />
                  <Label htmlFor="moderate" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">Moderate</div>
                    <div className="text-sm text-muted-foreground">Balanced approach. Mix of stable and growth opportunities.</div>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData.riskTolerance === 'aggressive' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/50'
                }`}>
                  <RadioGroupItem value="aggressive" id="aggressive" />
                  <Label htmlFor="aggressive" className="flex-1 cursor-pointer">
                    <div className="font-medium text-white">Aggressive</div>
                    <div className="text-sm text-muted-foreground">Higher risk for higher rewards. Experimental opportunities.</div>
                  </Label>
                </div>
              </RadioGroup>
            )}

            {/* Step 2: Capital */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="capital" className="text-white">Available Capital (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capital"
                      type="number"
                      placeholder="1000"
                      value={formData.capitalAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, capitalAvailable: e.target.value }))}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This helps us recommend businesses within your budget
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokenBudget" className="text-white">Monthly Token Budget (USD)</Label>
                  <div className="relative">
                    <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tokenBudget"
                      type="number"
                      placeholder="100"
                      value={formData.monthlyTokenBudget}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthlyTokenBudget: e.target.value }))}
                      className="pl-10 bg-secondary border-border"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Maximum monthly spend on AI model tokens
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Interests */}
            {step === 3 && (
              <div className="grid gap-3 md:grid-cols-2">
                {VERTICALS.map((vertical) => (
                  <div
                    key={vertical.id}
                    onClick={() => toggleInterest(vertical.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.interests.includes(vertical.id) 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : 'border-border hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={formData.interests.includes(vertical.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-white">{vertical.label}</div>
                        <div className="text-sm text-muted-foreground">{vertical.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Technical Skills */}
            {step === 4 && (
              <RadioGroup 
                value={formData.technicalSkills} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, technicalSkills: v as any }))}
                className="space-y-3"
              >
                {[
                  { value: 'beginner', label: 'Beginner', desc: 'No coding experience. Need fully automated solutions.' },
                  { value: 'intermediate', label: 'Intermediate', desc: 'Some coding knowledge. Can follow technical guides.' },
                  { value: 'advanced', label: 'Advanced', desc: 'Comfortable with APIs and scripting. Can customize.' },
                  { value: 'expert', label: 'Expert', desc: 'Full-stack developer. Can build custom integrations.' },
                ].map((skill) => (
                  <div 
                    key={skill.value}
                    className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      formData.technicalSkills === skill.value ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/50'
                    }`}
                  >
                    <RadioGroupItem value={skill.value} id={skill.value} />
                    <Label htmlFor={skill.value} className="flex-1 cursor-pointer">
                      <div className="font-medium text-white">{skill.label}</div>
                      <div className="text-sm text-muted-foreground">{skill.desc}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Step 5: Goals & Strategy */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-white">Business Goals (select all that apply)</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {GOALS.map((goal) => (
                      <div
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          formData.businessGoals.includes(goal.id) 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-border hover:border-emerald-500/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={formData.businessGoals.includes(goal.id)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-white">{goal.label}</div>
                            <div className="text-sm text-muted-foreground">{goal.description}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white">Strategy Timeframe</Label>
                    <RadioGroup 
                      value={formData.strategyTimeframe} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, strategyTimeframe: v as any }))}
                      className="space-y-2"
                    >
                      {[
                        { value: 'short', label: 'Short-term (1-3 months)' },
                        { value: 'medium', label: 'Medium-term (3-12 months)' },
                        { value: 'long', label: 'Long-term (1+ years)' },
                      ].map((tf) => (
                        <div key={tf.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={tf.value} id={`tf-${tf.value}`} />
                          <Label htmlFor={`tf-${tf.value}`} className="text-sm text-muted-foreground cursor-pointer">{tf.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Aggressiveness Level</Label>
                    <RadioGroup 
                      value={formData.aggressiveness} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, aggressiveness: v as any }))}
                      className="space-y-2"
                    >
                      {[
                        { value: 'low', label: 'Low - Careful, methodical' },
                        { value: 'medium', label: 'Medium - Balanced approach' },
                        { value: 'high', label: 'High - Fast, bold moves' },
                      ].map((agg) => (
                        <div key={agg.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={agg.value} id={`agg-${agg.value}`} />
                          <Label htmlFor={`agg-${agg.value}`} className="text-sm text-muted-foreground cursor-pointer">{agg.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={step === 1}
            className="border-border"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={upsertProfile.isPending}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
          >
            {step === STEPS.length ? (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {upsertProfile.isPending ? 'Saving...' : 'Find Businesses'}
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
