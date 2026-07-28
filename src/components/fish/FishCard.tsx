"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { ConfidenceBadge } from "@/components/common/ConfidenceBadge";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import type { FishPrediction } from "@/types/prediction";

export function FishCard({ prediction, rank, onOpen }: { prediction: FishPrediction; rank: number; onOpen: () => void }) {
  return <article className="fish-card"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="rank-bubble">{rank}</span><div><p className="text-xs font-bold text-sky-700">TOP {rank}</p><h3>{prediction.fishName}</h3></div></div><ScoreBadge level={prediction.level} /></div><div className="score-row"><strong>{prediction.suitabilityScore}<small>점</small></strong><div className="progress-track" aria-label={`환경 적합도 ${prediction.suitabilityScore}점`}><span style={{ width: `${prediction.suitabilityScore}%` }} /></div></div><p className="reason-line"><Sparkles size={15} aria-hidden />{prediction.reasons[0]}</p><div className="mt-auto flex items-center justify-between gap-2 pt-4"><ConfidenceBadge confidence={prediction.confidence} /><button className="text-button" onClick={onOpen}>자세히 보기<ChevronRight size={16} /></button></div></article>;
}
