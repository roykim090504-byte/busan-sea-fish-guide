"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { formatDateTime, formatValue } from "@/lib/formatters";
import type { MarineObservation } from "@/types/marine";
import type { FishPrediction } from "@/types/prediction";
import { ConfidenceBadge } from "@/components/common/ConfidenceBadge";
import { ScoreBadge } from "@/components/common/ScoreBadge";

export function AreaBottomSheet({ observation, predictions, onClose }: { observation: MarineObservation; predictions: FishPrediction[]; onClose: () => void }) {
  return <aside className="map-sheet" aria-label={`${observation.areaName} 상세 정보`}><button className="close-button" onClick={onClose} aria-label="닫기"><X /></button><p className="eyebrow">해역 상세</p><h2>{observation.areaName}</h2><p className="text-sm text-slate-500">{formatDateTime(observation.observedAt)} 기준</p><div className="map-data-grid"><span>수온 <b>{formatValue(observation.waterTemperature, "°C")}</b></span><span>바람 <b>{observation.windDirection ?? "-"} {formatValue(observation.windSpeed, "m/s")}</b></span><span>파고 <b>{formatValue(observation.waveHeight, "m")}</b></span><span>조류 <b>{formatValue(observation.currentSpeed, "m/s")}</b></span><span>날씨 <b>{observation.weather ?? "데이터 없음"}</b></span></div><h3 className="mt-5 font-black">예상 어종 순위</h3><div className="space-y-2">{predictions.slice(0, 3).map((item, index) => <div className="map-fish-row" key={item.fishId}><b>{index + 1}. {item.fishName}</b><span>{item.suitabilityScore}점</span><ScoreBadge level={item.level} /><ConfidenceBadge confidence={item.confidence} /><p>{item.reasons[0]}</p></div>)}</div>{predictions[0].warnings.map((warning) => <p className="mt-3 text-sm font-semibold text-orange-700" key={warning}>{warning}</p>)}<Link className="primary-button mt-5 w-full" href={`/area/${observation.areaId}`}>이 해역 자세히 보기</Link></aside>;
}
