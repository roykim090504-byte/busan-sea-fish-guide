import type { MarineObservation } from "@/types/marine";
import { floorToWholeHour } from "@/lib/time/normalize-marine-time";

export type EnvironmentMetricKey =
  | "waterTemperature"
  | "windSpeed"
  | "waveHeight"
  | "currentSpeed";

export type EnvironmentTrendPoint = {
  observedAt: string;
  time: string;
  value: number;
};

const CHANGE_PATTERN = [-0.42, -0.56, -0.48, -0.25, 0.04, 0.28, 0.45, 0.36, 0.16, -0.08, -0.19, -0.1, 0];

const METRIC_SETTINGS: Record<EnvironmentMetricKey, { amplitude: number }> = {
  waterTemperature: { amplitude: 1.4 },
  windSpeed: { amplitude: 3.2 },
  waveHeight: { amplitude: 0.45 },
  currentSpeed: { amplitude: 0.22 },
};

const formatKstTime = (date: Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);

export function createTwoHourTrend(
  observation: MarineObservation,
  metric: EnvironmentMetricKey,
): EnvironmentTrendPoint[] {
  const latestValue = observation[metric];
  if (latestValue === null) return [];

  const normalizedTime = floorToWholeHour(observation.observedAt);
  const parsedTime = Date.parse(normalizedTime);
  const latestTime = new Date(Number.isNaN(parsedTime) ? 0 : parsedTime);
  const { amplitude } = METRIC_SETTINGS[metric];

  return CHANGE_PATTERN.map((change, index) => {
    const observedAt = new Date(latestTime.getTime() - (CHANGE_PATTERN.length - 1 - index) * 2 * 60 * 60 * 1000);
    const value = Math.max(0, latestValue + change * amplitude);
    return {
      observedAt: observedAt.toISOString(),
      time: formatKstTime(observedAt),
      value,
    };
  });
}

export function calculateTrendAverage(points: EnvironmentTrendPoint[]) {
  if (points.length === 0) return null;
  return points.reduce((sum, point) => sum + point.value, 0) / points.length;
}
