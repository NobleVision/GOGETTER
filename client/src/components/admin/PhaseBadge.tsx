import { Badge } from "@/components/ui/badge";
import { PHASE_NAMES } from "@shared/const";

const PHASE_COLORS: Record<number, string> = {
  0: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  1: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  2: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  3: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  4: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  5: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  6: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function PhaseBadge({ phase }: { phase: number }) {
  const name = PHASE_NAMES[phase] ?? "UNKNOWN";
  const color = PHASE_COLORS[phase] ?? PHASE_COLORS[0];

  return (
    <Badge
      variant="outline"
      className={`${color} text-xs font-medium`}
    >
      {String(phase).padStart(2, "0")} {name}
    </Badge>
  );
}
