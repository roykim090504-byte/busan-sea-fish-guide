import { describe, expect, it } from "vitest";
import { floorToWholeHour, normalizeMarineObservationTime } from "./normalize-marine-time";

describe("해양 데이터 정각 기준 변환", () => {
  it("분과 초를 버리고 해당 정각으로 변환한다", () => {
    expect(floorToWholeHour("2026-07-28T09:25:48+09:00")).toBe("2026-07-28T00:00:00.000Z");
  });

  it("이미 정각인 값은 같은 시각을 유지한다", () => {
    expect(floorToWholeHour("2026-07-28T09:00:00+09:00")).toBe("2026-07-28T00:00:00.000Z");
  });

  it("관측 객체의 시각만 정규화한다", () => {
    const observation = normalizeMarineObservationTime({
      areaId: "gijang",
      areaName: "기장 앞바다",
      latitude: 35.238,
      longitude: 129.245,
      observedAt: "2026-07-28T09:25:00+09:00",
      waterTemperature: 22.4,
      airTemperature: 27.3,
      windSpeed: 3.8,
      windDirection: "남동",
      waveHeight: 0.6,
      currentSpeed: 0.55,
      weather: "맑음",
    });
    expect(observation.observedAt).toBe("2026-07-28T00:00:00.000Z");
    expect(observation.waterTemperature).toBe(22.4);
  });
});
