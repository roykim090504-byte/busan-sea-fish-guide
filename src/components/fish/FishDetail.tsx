"use client";

import { X } from "lucide-react";
import { FISH_CONDITIONS } from "@/data/fish-conditions";
import { formatValue } from "@/lib/formatters";
import type { MarineObservation } from "@/types/marine";
import type { FishPrediction } from "@/types/prediction";
import { ConfidenceBadge } from "@/components/common/ConfidenceBadge";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import { SuitabilityChart } from "./SuitabilityChart";

export function FishDetail({ prediction, observation, onClose }: { prediction: FishPrediction; observation: MarineObservation; onClose: () => void }) {
  const condition = FISH_CONDITIONS.find((item) => item.fishId === prediction.fishId);
  if (!condition) return null;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="fish-detail-title" onMouseDown={onClose}><section className="bottom-sheet" onMouseDown={(event) => event.stopPropagation()}><button className="close-button" onClick={onClose} aria-label="상세 정보 닫기"><X /></button><div className="mb-6"><p className="eyebrow">어종 상세 분석</p><h2 id="fish-detail-title" className="text-3xl font-black">{prediction.fishName}</h2><div className="mt-3 flex flex-wrap items-center gap-3"><strong className="text-3xl text-sky-800">{prediction.suitabilityScore}점</strong><ScoreBadge level={prediction.level} /><ConfidenceBadge confidence={prediction.confidence} /></div></div><div className="detail-grid"><div className="info-panel"><h3>항목별 적합도</h3><SuitabilityChart prediction={prediction} /></div><div className="info-panel"><h3>현재 {observation.areaName}</h3><dl className="compact-dl"><div><dt>수온</dt><dd>{formatValue(observation.waterTemperature, "°C")}</dd></div><div><dt>풍속</dt><dd>{formatValue(observation.windSpeed, "m/s")}</dd></div><div><dt>파고</dt><dd>{formatValue(observation.waveHeight, "m")}</dd></div><div><dt>조류</dt><dd>{formatValue(observation.currentSpeed, "m/s")}</dd></div></dl></div><div className="info-panel"><h3>선호 환경</h3><p>최적 수온 {condition.preferredWaterTemperature.optimalMin}~{condition.preferredWaterTemperature.optimalMax}°C</p><p>풍속 {condition.preferredWindSpeed.min}~{condition.preferredWindSpeed.max}m/s · 파고 {condition.preferredWaveHeight.min}~{condition.preferredWaveHeight.max}m</p></div><div className="info-panel"><h3>판단 이유</h3><ul className="bullet-list">{prediction.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>{prediction.missingData.length > 0 && <p className="mt-3 text-sm font-semibold text-orange-700">누락 데이터: {prediction.missingData.join(", ")}</p>}</div></div><p className="disclaimer mt-5">이 점수는 실제 어획 확률이 아닌 해양 환경 적합도 환산값입니다. 해양 환경 데이터를 기반으로 계산한 참고용 예측입니다.</p></section></div>;
}
