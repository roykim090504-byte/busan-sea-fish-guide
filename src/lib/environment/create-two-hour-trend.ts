import type { MarineObservation } from "@/types/marine";

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

const METRIC_SETTINGS: Record<EnvironmentMetricKey, { amplitude: number; decimals: number }> = {
  waterTemperature: { amplitude: 1.4, decimals: 1 },
  windSpeed: { amplitude: 3.2, decimals: 1 },
  waveHeight: { amplitude: 0.45, decimals: 2 },
  currentSpeed: { amplitude: 0.22, decimals: 2 },
};

const formatKstTime = (date: Date) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);

export function createTwoHourTrend(
  observation: MarineObservation,
  metric: EnvironmentMetricKey,
): EnvironmentTrendPoint[] {
  const latestValue = observation[metric];
  if (latestValue === null) return [];

  const parsedTime = Date.parse(observation.observedAt);
  const latestTime = new Date(Number.isNaN(parsedTime) ? 0 : parsedTime);
  const { amplitude, decimals } = METRIC_SETTINGS[metric];

  return CHANGE_PATTERN.map((change, index) => {
    const observedAt = new Date(latestTime.getTime() - (CHANGE_PATTERN.length - 1 - index) * 2 * 60 * 60 * 1000);
    const value = Math.max(0, latestValue + change * amplitude);
    return {
      observedAt: observedAt.toISOString(),
      time: formatKstTime(observedAt),
      value: Number(value.toFixed(decimals)),
    };
  });
}

export function calculateTrendAverage(points: EnvironmentTrendPoint[], decimals: number) {
  if (points.length === 0) return null;
  const average = points.reduce((sum, point) => sum + point.value, 0) / points.length;
  return Number(average.toFixed(decimals));
}
