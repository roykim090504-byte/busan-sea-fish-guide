import { ShieldCheck } from "lucide-react";
import { CONFIDENCE_LABELS } from "@/lib/formatters";
import type { Confidence } from "@/types/prediction";

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600"><ShieldCheck size={14} aria-hidden />신뢰도 {CONFIDENCE_LABELS[confidence]}</span>;
}
