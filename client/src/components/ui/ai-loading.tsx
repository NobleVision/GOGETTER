/**
 * AI Loading Indicator Component
 * Provides animated loading states for AI processing operations
 */

import { cn } from "@/lib/utils";
import { Cpu, Zap, Brain, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

interface AILoadingProps {
  message?: string;
  submessage?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "detailed";
  className?: string;
}

const LOADING_MESSAGES = [
  "Analyzing opportunities...",
  "Processing market data...",
  "Generating recommendations...",
  "Optimizing results...",
  "Finalizing insights...",
];

const SUBMESSAGES = [
  "This may take a few moments",
  "AI models are working hard",
  "Crunching the numbers",
  "Almost there...",
];

export function AILoading({ 
  message, 
  submessage,
  size = "md", 
  variant = "default",
  className 
}: AILoadingProps) {
  const [currentMessage, setCurrentMessage] = useState(message || LOADING_MESSAGES[0]);
  const [currentSubmessage, setCurrentSubmessage] = useState(submessage || SUBMESSAGES[0]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (message) return; // Don't cycle if message is provided

    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        const next = (prev + 1) % LOADING_MESSAGES.length;
        setCurrentMessage(LOADING_MESSAGES[next]);
        setCurrentSubmessage(SUBMESSAGES[next % SUBMESSAGES.length]);
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [message]);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const iconSizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
  };

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative">
          <Cpu className={cn(iconSizeClasses[size], "text-emerald-400 animate-pulse")} />
          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
        <span className="text-sm text-muted-foreground">{currentMessage}</span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("flex flex-col items-center space-y-6 p-8", className)}>
        {/* Animated AI Brain */}
        <div className="relative">
          <div className={cn(
            sizeClasses[size],
            "rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 flex items-center justify-center animate-pulse"
          )}>
            <div className={cn(
              "rounded-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30 flex items-center justify-center animate-pulse",
              size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-12 w-12"
            )}>
              <Brain className={cn(iconSizeClasses[size], "text-emerald-400")} />
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2">
            <Sparkles className="h-4 w-4 text-emerald-400 animate-bounce" style={{ animationDelay: '0s' }} />
          </div>
          <div className="absolute -bottom-2 -left-2">
            <Zap className="h-3 w-3 text-teal-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute top-0 -left-4">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex space-x-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full bg-emerald-400",
                "animate-pulse"
              )}
              style={{ 
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* Messages */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-white animate-pulse">
            {currentMessage}
          </p>
          <p className="text-sm text-muted-foreground">
            {currentSubmessage}
          </p>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        <div className={cn(
          sizeClasses[size],
          "rounded-full bg-emerald-500/20 flex items-center justify-center"
        )}>
          <div className={cn(
            "rounded-full bg-emerald-500/30 flex items-center justify-center animate-pulse",
            size === "sm" ? "h-6 w-6" : size === "md" ? "h-8 w-8" : "h-12 w-12"
          )}>
            <Cpu className={cn(iconSizeClasses[size], "text-emerald-400")} />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 animate-ping" />
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500" />
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-white">{currentMessage}</p>
        <p className="text-xs text-muted-foreground mt-1">{currentSubmessage}</p>
      </div>
    </div>
  );
}

interface AIProcessingOverlayProps {
  isVisible: boolean;
  message?: string;
  onCancel?: () => void;
}

export function AIProcessingOverlay({ 
  isVisible, 
  message = "AI is processing your request...",
  onCancel 
}: AIProcessingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-4">
        <AILoading 
          message={message}
          variant="detailed"
          size="lg"
        />
        {onCancel && (
          <div className="mt-6 text-center">
            <button
              onClick={onCancel}
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}