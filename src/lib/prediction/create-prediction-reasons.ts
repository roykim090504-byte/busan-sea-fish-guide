import type { FishCondition } from "@/types/fish";
import type { MarineObservation } from "@/types/marine";
import type { ScoreKey } from "@/types/prediction";

export function createPredictionReasons(
  observation: MarineObservation,
  fish: FishCondition,
  scores: Partial<Record<ScoreKey, number>>,
  month: number,
) {
  const reasons: string[] = [];
  if (observation.waterTemperature !== null) {
    const t = observation.waterTemperature;
    if (t >= fish.preferredWaterTemperature.optimalMin && t <= fish.preferredWaterTemperature.optimalMax) {
      reasons.push(`현재 수온 ${t.toFixed(1)}°C가 ${fish.fishName}의 최적 수온 범위에 포함됩니다.`);
    } else if ((scores.temperature ?? 0) < 50) {
      reasons.push(`현재 수온이 ${fish.fishName}의 선호 수온 범위와 차이가 있습니다.`);
    } else {
      reasons.push(`현재 수온이 ${fish.fishName}의 활동 가능 범위에 가깝습니다.`);
    }
  }
  reasons.push(fish.preferredMonths.includes(month)
    ? `현재 계절이 ${fish.fishName}의 주요 출현 시기와 일치합니다.`
    : `현재 계절은 ${fish.fishName}의 주요 출현 시기와 차이가 있습니다.`);
  if ((scores.wind ?? 100) < 50) reasons.push("풍속이 해당 어종의 선호 범위를 벗어납니다.");
  if ((scores.wave ?? 100) < 50) reasons.push("파고가 해당 어종의 선호 범위보다 높거나 낮습니다.");
  if ((scores.current ?? 0) >= 80) reasons.push(`조류 속도가 ${fish.fishName}의 선호 환경에 가깝습니다.`);
  return reasons;
}
