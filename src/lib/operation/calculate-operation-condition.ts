import { clamp } from "@/lib/utils";
import type { MarineObservation } from "@/types/marine";
import type {
  OperationCondition,
  OperationConditionLevel,
  OperationScoreKey,
} from "@/types/operation";

const OPERATION_WEIGHTS: Record<OperationScoreKey, number> = {
  wind: 0.35,
  wave: 0.4,
  current: 0.1,
  weather: 0.1,
  freshness: 0.05,
};

const scoreWind = (value: number | null) => {
  if (value === null) return 0;
  if (value <= 4) return 100;
  if (value <= 7) return 85;
  if (value <= 10) return 60;
  if (value < 14) return 25;
  return 0;
};

const scoreWave = (value: number | null) => {
  if (value === null) return 0;
  if (value <= 0.5) return 100;
  if (value <= 1) return 85;
  if (value <= 1.5) return 65;
  if (value <= 2) return 40;
  if (value < 3) return 20;
  return 0;
};

const scoreCurrent = (value: number | null) => {
  if (value === null) return 0;
  if (value <= 0.4) return 95;
  if (value <= 0.8) return 80;
  if (value <= 1.2) return 60;
  if (value <= 1.8) return 35;
  return 15;
};

const scoreWeather = (weather: string | null) => {
  if (weather === null || weather.includes("미상")) return 0;
  if (/(태풍|폭풍|뇌우)/.test(weather)) return 0;
  if (/(눈|비)/.test(weather) && !weather.includes("없음")) return 35;
  if (weather.includes("흐림")) return 75;
  if (weather.includes("구름")) return 90;
  return 100;
};

const observationAgeHours = (observedAt: string, now: Date) => {
  const observedTime = Date.parse(observedAt);
  if (Number.isNaN(observedTime)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - observedTime) / (60 * 60 * 1000));
};

const scoreFreshness = (hours: number) => {
  if (hours <= 1) return 100;
  if (hours <= 3) return 85;
  if (hours <= 6) return 60;
  if (hours <= 12) return 35;
  return 0;
};

const scoreToLevel = (score: number): OperationConditionLevel =>
  score >= 80
    ? "very-good"
    : score >= 65
      ? "good"
      : score >= 45
        ? "caution"
        : score >= 25
          ? "difficult"
          : "reconsider";

const LEVEL_CONTENT: Record<OperationConditionLevel, { label: string; summary: string }> = {
  "very-good": { label: "매우 양호", summary: "현재 관측 환경은 조업 준비를 검토하기에 비교적 양호합니다." },
  good: { label: "양호", summary: "대체로 양호하지만 출항 전 최신 특보와 현지 상황을 확인하세요." },
  caution: { label: "주의", summary: "주의가 필요한 조건이 있습니다. 선박과 조업 방식에 맞춰 신중히 판단하세요." },
  difficult: { label: "어려움", summary: "조업에 부담이 될 수 있는 환경입니다. 출항 계획을 보수적으로 검토하세요." },
  reconsider: { label: "출항 재검토", summary: "위험하거나 불확실한 조건이 있어 출항 여부를 다시 확인해야 합니다." },
};

export function calculateOperationCondition(
  observation: MarineObservation,
  now = new Date(),
): OperationCondition {
  const ageHours = observationAgeHours(observation.observedAt, now);
  const componentScores: Record<OperationScoreKey, number> = {
    wind: scoreWind(observation.windSpeed),
    wave: scoreWave(observation.waveHeight),
    current: scoreCurrent(observation.currentSpeed),
    weather: scoreWeather(observation.weather),
    freshness: scoreFreshness(ageHours),
  };

  let score = Math.round(
    Object.entries(componentScores).reduce(
      (sum, [key, value]) => sum + value * OPERATION_WEIGHTS[key as OperationScoreKey],
      0,
    ),
  );
  const warnings: string[] = [];
  const reasons: string[] = [];

  if (observation.windSpeed === null) warnings.push("풍속 데이터가 없습니다.");
  else if (observation.windSpeed >= 14) reasons.push(`풍속 ${observation.windSpeed}m/s로 풍랑주의보 기준 수준입니다.`);
  else if (observation.windSpeed > 10) reasons.push(`풍속 ${observation.windSpeed}m/s로 강한 바람에 대비가 필요합니다.`);
  else if (observation.windSpeed <= 7) reasons.push(`풍속 ${observation.windSpeed}m/s로 비교적 잔잔한 편입니다.`);
  else reasons.push(`풍속 ${observation.windSpeed}m/s로 주의가 필요합니다.`);

  if (observation.waveHeight === null) warnings.push("파고 데이터가 없습니다.");
  else if (observation.waveHeight >= 3) reasons.push(`파고 ${observation.waveHeight}m로 풍랑주의보 기준 수준입니다.`);
  else if (observation.waveHeight >= 2) reasons.push(`파고 ${observation.waveHeight}m로 높은 물결에 대비가 필요합니다.`);
  else if (observation.waveHeight <= 1) reasons.push(`파고 ${observation.waveHeight}m로 비교적 낮은 편입니다.`);
  else reasons.push(`파고 ${observation.waveHeight}m로 선박 규모에 따른 주의가 필요합니다.`);

  if (observation.currentSpeed === null) warnings.push("조류 데이터가 없습니다.");
  else if (observation.currentSpeed > 1.2) reasons.push(`조류 ${observation.currentSpeed}m/s로 작업 부담이 커질 수 있습니다.`);
  else reasons.push(`조류 ${observation.currentSpeed}m/s가 참고 범위 안에 있습니다.`);

  if (observation.weather === null || observation.weather.includes("미상")) warnings.push("날씨 상태 데이터가 없습니다.");
  else if (componentScores.weather <= 35) reasons.push(`${observation.weather} 상태로 시야와 갑판 작업에 주의가 필요합니다.`);

  const criticalMarineCondition =
    (observation.windSpeed !== null && observation.windSpeed >= 14)
    || (observation.waveHeight !== null && observation.waveHeight >= 3);
  if (criticalMarineCondition) score = Math.min(score, 19);

  const missingWindOrWave = [observation.windSpeed, observation.waveHeight].filter((value) => value === null).length;
  if (missingWindOrWave === 2) score = Math.min(score, 19);
  else if (missingWindOrWave === 1) score = Math.min(score, 64);

  if (ageHours > 12) {
    score = Math.min(score, 44);
    warnings.push("관측 시각이 오래되어 최신 상황과 다를 수 있습니다.");
  }
  if (observation.source === "sample") {
    score = Math.min(score, 64);
    warnings.push("예시 데이터이므로 실제 출항 판단에 사용할 수 없습니다.");
  }

  score = clamp(score);
  const level = scoreToLevel(score);
  return {
    score,
    level,
    ...LEVEL_CONTENT[level],
    componentScores,
    reasons: reasons.slice(0, 3),
    warnings,
  };
}
