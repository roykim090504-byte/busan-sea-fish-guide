import type { MarineApiResponse, MarineObservation } from "@/types/marine";

export function floorToWholeHour(value: string | Date) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "1970-01-01T00:00:00.000Z";
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

export const normalizeMarineObservationTime = (
  observation: MarineObservation,
): MarineObservation => ({
  ...observation,
  observedAt: floorToWholeHour(observation.observedAt),
});

export const normalizeMarineApiResponseTimes = (
  response: MarineApiResponse,
): MarineApiResponse => ({
  ...response,
  observations: response.observations.map(normalizeMarineObservationTime),
  fetchedAt: floorToWholeHour(response.fetchedAt),
});
