import { FISH_CONDITIONS } from "@/data/fish-conditions";
import { clamp } from "@/lib/utils";
import type { FishCondition, Range } from "@/types/fish";
import type { MarineObservation } from "@/types/marine";
import type { FishPrediction, ScoreKey, SuitabilityLevel } from "@/types/prediction";
import { calculateConfidence, isStaleObservation } from "./calculate-confidence";
import { createPredictionReasons } from "./create-prediction-reasons";

export const SCORE_WEIGHTS: Record<ScoreKey, number> = {
  temperature: 0.5, season: 0.2, wind: 0.1, wave: 0.1, current: 0.1,
};

const rangeScore = (value: number, range: Range) => {
  const width = Math.max(range.max - range.min, 0.1);
  const center = (range.min + range.max) / 2;
  const halfWidth = width / 2;
  if (value >= range.min && value <= range.max) {
    const distanceFromCenter = Math.abs(value - center) / halfWidth;
    return clamp(100 - distanceFromCenter * 18);
  }
  const distance = value < range.min ? range.min - value : value - range.max;
  return clamp(82 - (distance / width) * 110);
};

const temperatureScore = (value: number, fish: FishCondition) => {
  const range = fish.preferredWaterTemperature;
  if (value >= range.optimalMin && value <= range.optimalMax) {
    const optimalCenter = (range.optimalMin + range.optimalMax) / 2;
    const optimalHalfWidth = Math.max((range.optimalMax - range.optimalMin) / 2, 0.5);
    return clamp(100 - (Math.abs(value - optimalCenter) / optimalHalfWidth) * 10);
  }
  if (value >= range.min && value < range.optimalMin) {
    const ratio = (range.optimalMin - value) / Math.max(range.optimalMin - range.min, 1);
    return clamp(90 - ratio * 45);
  }
  if (value > range.optimalMax && value <= range.max) {
    const ratio = (value - range.optimalMax) / Math.max(range.max - range.optimalMax, 1);
    return clamp(90 - ratio * 45);
  }
  const distance = value < range.min ? range.min - value : value - range.max;
  const totalWidth = Math.max(range.max - range.min, 1);
  return clamp(45 - (distance / totalWidth) * 100);
};

export const scoreToLevel = (score: number): SuitabilityLevel =>
  score >= 80 ? "very-high" : score >= 60 ? "high" : score >= 40 ? "medium" : score >= 20 ? "low" : "very-low";

export function calculateFishScore(
  observation: MarineObservation,
  fish: FishCondition,
  now = new Date(),
): FishPrediction {
  const month = now.getMonth() + 1;
  const componentScores: Partial<Record<ScoreKey, number>> = { season: fish.preferredMonths.includes(month) ? 92 : 20 };
  const missingData: string[] = [];

  if (observation.waterTemperature === null) missingData.push("수온");
  else componentScores.temperature = temperatureScore(observation.waterTemperature, fish);
  if (observation.windSpeed === null) missingData.push("풍속");
  else componentScores.wind = rangeScore(observation.windSpeed, fish.preferredWindSpeed);
  if (observation.waveHeight === null) missingData.push("파고");
  else componentScores.wave = rangeScore(observation.waveHeight, fish.preferredWaveHeight);
  if (observation.currentSpeed === null || !fish.preferredCurrentSpeed) missingData.push("조류");
  else componentScores.current = rangeScore(observation.currentSpeed, fish.preferredCurrentSpeed);

  const entries = Object.entries(componentScores) as [ScoreKey, number][];
  const weightTotal = entries.reduce((sum, [key]) => sum + SCORE_WEIGHTS[key], 0);
  const suitabilityScore = clamp(Math.round(entries.reduce((sum, [key, score]) => sum + score * SCORE_WEIGHTS[key], 0) / weightTotal));
  const warnings: string[] = [];
  if (missingData.length) warnings.push("일부 해양 데이터가 없어 제한된 정보만으로 계산했습니다.");
  if (isStaleObservation(observation.observedAt, now)) warnings.push("현재 표시된 정보는 최신 관측 데이터가 아닐 수 있습니다.");

  return {
    fishId: fish.fishId,
    fishName: fish.fishName,
    suitabilityScore,
    level: scoreToLevel(suitabilityScore),
    confidence: calculateConfidence(observation, now),
    reasons: createPredictionReasons(observation, fish, componentScores, month),
    warnings,
    componentScores,
    missingData,
  };
}

export const calculatePredictions = (observation: MarineObservation, now = new Date()) =>
  FISH_CONDITIONS.map((fish) => calculateFishScore(observation, fish, now))
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);
