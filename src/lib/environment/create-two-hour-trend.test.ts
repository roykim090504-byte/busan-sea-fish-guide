import { describe, expect, it } from "vitest";
import type { MarineObservation } from "@/types/marine";
import { calculateTrendAverage, createTwoHourTrend } from "./create-two-hour-trend";

const observation: MarineObservation = {
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
};

describe("2시간 간격 환경 추세", () => {
  it("24시간 동안 2시간 간격의 13개 값을 만든다", () => {
    const points = createTwoHourTrend(observation, "waterTemperature");
    expect(points).toHaveLength(13);
    expect(Date.parse(points[1].observedAt) - Date.parse(points[0].observedAt)).toBe(2 * 60 * 60 * 1000);
    expect(new Date(points[0].observedAt).getUTCMinutes()).toBe(0);
    expect(points.every((point) => point.time.includes("25") === false)).toBe(true);
    expect(points.at(-1)?.value).toBe(observation.waterTemperature);
  });

  it("데이터가 없으면 빈 추세와 null 평균을 반환한다", () => {
    const points = createTwoHourTrend({ ...observation, currentSpeed: null }, "currentSpeed");
    expect(points).toEqual([]);
    expect(calculateTrendAverage(points, 2)).toBeNull();
  });

  it("추세 평균을 지정한 소수 자릿수로 계산한다", () => {
    const points = createTwoHourTrend(observation, "waveHeight");
    expect(calculateTrendAverage(points, 2)).toBeTypeOf("number");
  });
});
