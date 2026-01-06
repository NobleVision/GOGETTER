/**
 * Progress Feedback Component
 * Provides progress indicators and feedback for long-running operations
 */

import { cn } from "@/lib/utils";
import { Progress } from "./progress";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "./card";

export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "error";
  error?: string;
}

interface ProgressFeedbackProps {
  steps: ProgressStep[];
  currentStep?: string;
  progress?: number;
  title?: string;
  className?: string;
  showProgress?: boolean;
  compact?: boolean;
}

export function ProgressFeedback({
  steps,
  currentStep,
  progress,
  title = "Processing...",
  className,
  showProgress = true,
  compact = false,
}: ProgressFeedbackProps) {
  const completedSteps = steps.filter(step => step.status === "completed").length;
  const totalSteps = steps.length;
  const calculatedProgress = progress ?? (completedSteps / totalSteps) * 100;

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepTextColor = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return "text-emerald-400";
      case "in_progress":
        return "text-blue-400";
      case "error":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <h3 className="text-sm font-medium text-white">{title}</h3>
        )}
        
        {showProgress && (
          <div className="space-y-2">
            <Progress value={calculatedProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedSteps} of {totalSteps} completed</span>
              <span>{Math.round(calculatedProgress)}%</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-2 text-sm",
                step.id === currentStep && "font-medium"
              )}
            >
              {getStepIcon(step)}
              <span className={getStepTextColor(step)}>{step.title}</span>
              {step.status === "error" && step.error && (
                <span className="text-xs text-red-400">- {step.error}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            {showProgress && (
              <div className="space-y-2">
                <Progress value={calculatedProgress} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{completedSteps} of {totalSteps} steps completed</span>
                  <span>{Math.round(calculatedProgress)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-4 top-8 w-px h-8 bg-border" />
                )}
                
                <div className={cn(
                  "flex items-start gap-4 p-3 rounded-lg transition-colors",
                  step.id === currentStep && "bg-secondary/50",
                  step.status === "error" && "bg-red-500/5"
                )}>
                  <div className="flex-shrink-0 mt-0.5">
                    {getStepIcon(step)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium",
                      getStepTextColor(step)
                    )}>
                      {step.title}
                    </div>
                    
                    {step.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </div>
                    )}
                    
                    {step.status === "error" && step.error && (
                      <div className="text-sm text-red-400 mt-1">
                        Error: {step.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SimpleProgressProps {
  message: string;
  progress?: number;
  className?: string;
}

export function SimpleProgress({ 
  message, 
  progress, 
  className 
}: SimpleProgressProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
        <span className="text-sm text-white">{message}</span>
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
}