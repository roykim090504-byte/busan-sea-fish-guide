import { describe, expect, it } from "vitest";
import type { MarineObservation } from "@/types/marine";
import { calculateOperationCondition } from "./calculate-operation-condition";

const now = new Date("2026-07-28T10:00:00+09:00");
const calmObservation: MarineObservation = {
  areaId: "test",
  areaName: "테스트 해역",
  latitude: 35,
  longitude: 129,
  observedAt: "2026-07-28T09:30:00+09:00",
  waterTemperature: 22,
  airTemperature: 27,
  windSpeed: 3,
  windDirection: "남",
  waveHeight: 0.4,
  currentSpeed: 0.3,
  weather: "맑음",
  source: "live",
};

describe("조업 환경 참고 지표", () => {
  it("잔잔하고 최신인 관측은 매우 양호로 계산한다", () => {
    expect(calculateOperationCondition(calmObservation, now).level).toBe("very-good");
  });

  it("풍랑주의보 수준의 풍속은 출항 재검토로 계산한다", () => {
    const result = calculateOperationCondition({ ...calmObservation, windSpeed: 14 }, now);
    expect(result.level).toBe("reconsider");
    expect(result.score).toBeLessThan(20);
  });

  it("풍랑주의보 수준의 파고는 출항 재검토로 계산한다", () => {
    expect(calculateOperationCondition({ ...calmObservation, waveHeight: 3 }, now).level).toBe("reconsider");
  });

  it("풍속이나 파고가 누락되면 양호 단계로 표시하지 않는다", () => {
    const result = calculateOperationCondition({ ...calmObservation, waveHeight: null }, now);
    expect(result.score).toBeLessThan(65);
    expect(result.warnings).toContain("파고 데이터가 없습니다.");
  });

  it("예시 데이터는 주의 단계보다 높아지지 않는다", () => {
    expect(calculateOperationCondition({ ...calmObservation, source: "sample" }, now).score).toBeLessThan(65);
  });

  it("오래된 관측은 어려움 단계보다 높아지지 않는다", () => {
    const result = calculateOperationCondition({ ...calmObservation, observedAt: "2026-07-27T09:30:00+09:00" }, now);
    expect(result.score).toBeLessThan(45);
  });
});
