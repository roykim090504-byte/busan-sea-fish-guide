import { LEVEL_LABELS } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SuitabilityLevel } from "@/types/prediction";

const styles: Record<SuitabilityLevel, string> = {
  "very-high": "bg-blue-700 text-white",
  high: "bg-sky-600 text-white",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-orange-100 text-orange-800",
  "very-low": "bg-slate-200 text-slate-700",
};

export function ScoreBadge({ level }: { level: SuitabilityLevel }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold", styles[level])}>{LEVEL_LABELS[level]}</span>;
}
