import { describe, expect, it } from "vitest";
import { FISH_CONDITIONS } from "@/data/fish-conditions";
import { calculateConfidence } from "./calculate-confidence";
import { calculateFishScore, calculatePredictions } from "./calculate-fish-score";
import type { MarineObservation } from "@/types/marine";

const fish = FISH_CONDITIONS[0];
const base: MarineObservation = {
  areaId: "test", areaName: "테스트", latitude: 35, longitude: 129,
  observedAt: "2026-07-28T09:00:00+09:00", waterTemperature: 22, airTemperature: 27,
  windSpeed: 3, windDirection: "남", waveHeight: 0.7, currentSpeed: 0.5, weather: "맑음",
};
const now = new Date("2026-07-28T10:00:00+09:00");

describe("규칙 기반 환경 적합도", () => {
  it("최적 수온에서 수온 점수가 높다", () => expect(calculateFishScore(base, fish, now).componentScores.temperature).toBe(100));
  it("선호 수온에서 멀어질수록 점수가 감소한다", () => {
    const near = calculateFishScore({ ...base, waterTemperature: 19 }, fish, now);
    const far = calculateFishScore({ ...base, waterTemperature: 5 }, fish, now);
    expect(near.componentScores.temperature!).toBeGreaterThan(far.componentScores.temperature!);
  });
  it("선호 계절에 점수가 높다", () => {
    const summer = calculateFishScore(base, fish, now);
    const winter = calculateFishScore(base, fish, new Date("2026-01-15T10:00:00+09:00"));
    expect(summer.componentScores.season!).toBeGreaterThan(winter.componentScores.season!);
  });
  it("풍속이 선호 범위를 벗어나면 감소한다", () => expect(calculateFishScore({ ...base, windSpeed: 20 }, fish, now).componentScores.wind).toBeLessThan(100));
  it("파고가 선호 범위를 벗어나면 감소한다", () => expect(calculateFishScore({ ...base, waveHeight: 5 }, fish, now).componentScores.wave).toBeLessThan(100));
  it("누락 데이터 가중치를 제외하고 재계산한다", () => {
    const full = calculateFishScore(base, fish, now);
    const missing = calculateFishScore({ ...base, currentSpeed: null }, fish, now);
    expect(missing.missingData).toContain("조류");
    expect(missing.suitabilityScore).toBe(full.suitabilityScore);
  });
  it("주요 데이터가 없으면 신뢰도가 낮다", () => expect(calculateConfidence({ ...base, waterTemperature: null, windSpeed: null, currentSpeed: null }, now)).toBe("low"));
  it("오래된 데이터에서 신뢰도가 낮다", () => expect(calculateConfidence({ ...base, observedAt: "2026-07-01T09:00:00+09:00" }, now)).toBe("low"));
  it("최종 점수는 항상 0~100이다", () => expect(calculateFishScore({ ...base, windSpeed: 1000, waveHeight: 1000 }, fish, now).suitabilityScore).toBeGreaterThanOrEqual(0));
  it("어종 목록은 점수 내림차순이다", () => {
    const scores = calculatePredictions(base, now).map((item) => item.suitabilityScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});
