"use client";

import { useState } from "react";
import type { MarineObservation } from "@/types/marine";
import type { FishPrediction } from "@/types/prediction";
import { FishCard } from "./FishCard";
import { FishDetail } from "./FishDetail";

export function TopFishCards({ predictions, observation }: { predictions: FishPrediction[]; observation: MarineObservation }) {
  const [selected, setSelected] = useState<FishPrediction | null>(null);
  return <section className="mt-8" aria-labelledby="top-fish-title"><div className="section-heading"><div><p className="eyebrow">환경 적합도 분석</p><h2 id="top-fish-title">오늘 주목할 어종</h2></div><p className="hidden text-sm text-slate-500 md:block">실제 어획 확률이 아닌 환경 적합도 환산값</p></div><div className="grid gap-4 md:grid-cols-3">{predictions.slice(0, 3).map((prediction, index) => <FishCard key={prediction.fishId} prediction={prediction} rank={index + 1} onOpen={() => setSelected(prediction)} />)}</div>{selected && <FishDetail prediction={selected} observation={observation} onClose={() => setSelected(null)} />}</section>;
}
