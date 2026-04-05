import { Check } from "lucide-react";
import { PHASE_NAMES, PHASE_DESCRIPTIONS } from "@shared/const";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PHASE_ACCENT: Record<number, string> = {
  0: "bg-slate-500",
  1: "bg-blue-500",
  2: "bg-purple-500",
  3: "bg-amber-500",
  4: "bg-orange-500",
  5: "bg-cyan-500",
  6: "bg-emerald-500",
};

export default function PhaseStepper({
  currentPhase,
}: {
  currentPhase: number;
}) {
  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto py-2">
      {PHASE_NAMES.map((name, idx) => {
        const isCompleted = idx < currentPhase;
        const isCurrent = idx === currentPhase;
        const accent = PHASE_ACCENT[idx];

        return (
          <div key={idx} className="flex items-center flex-1 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      isCompleted
                        ? `${accent} text-white`
                        : isCurrent
                          ? `${accent} text-white ring-2 ring-offset-2 ring-offset-slate-900 ring-white/50`
                          : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      String(idx).padStart(2, "0")
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-tight text-center truncate w-full ${
                      isCurrent
                        ? "text-white font-medium"
                        : isCompleted
                          ? "text-slate-300"
                          : "text-slate-500"
                    }`}
                  >
                    {name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  Phase {String(idx).padStart(2, "0")}: {name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PHASE_DESCRIPTIONS[idx]}
                </p>
              </TooltipContent>
            </Tooltip>
            {idx < 6 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  idx < currentPhase
                    ? "bg-slate-500"
                    : "bg-slate-700"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
