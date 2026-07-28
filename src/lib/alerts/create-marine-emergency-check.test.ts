import { describe, expect, it } from "vitest";
import type { MarineObservation } from "@/types/marine";
import { createMarineEmergencySummary } from "./create-marine-emergency-check";

const now = new Date("2026-07-28T10:00:00+09:00");
const observation: MarineObservation = {
  areaId: "test",
  areaName: "테스트 해역",
  latitude: 35,
  longitude: 129,
  observedAt: "2026-07-28T09:00:00+09:00",
  waterTemperature: 22,
  airTemperature: 27,
  windSpeed: 3,
  windDirection: "남",
  waveHeight: 0.4,
  currentSpeed: 0.3,
  weather: "맑음",
  source: "live",
};

describe("해상 위급 상황 점검", () => {
  it("잔잔한 최신 관측은 정상으로 표시한다", () => {
    expect(createMarineEmergencySummary(observation, now).severity).toBe("normal");
  });

  it("풍속 14m/s 이상은 풍랑주의보 기준 수준으로 표시한다", () => {
    const result = createMarineEmergencySummary({ ...observation, windSpeed: 14 }, now);
    expect(result.severity).toBe("danger");
    expect(result.checks[0].status).toBe("기준 수준 도달");
  });

  it("파고 2m 이상은 높은 물결 경계로 표시한다", () => {
    const result = createMarineEmergencySummary({ ...observation, waveHeight: 2 }, now);
    expect(result.severity).toBe("warning");
  });

  it("위험 날씨를 즉시 확인 필요로 표시한다", () => {
    expect(createMarineEmergencySummary({ ...observation, weather: "뇌우" }, now).severity).toBe("danger");
  });

  it("예시 데이터는 위급 신호 없음으로 단정하지 않는다", () => {
    expect(createMarineEmergencySummary({ ...observation, source: "sample" }, now).severity).toBe("unknown");
  });
});
