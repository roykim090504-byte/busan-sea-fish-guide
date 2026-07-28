import type { MarineObservation } from "@/types/marine";
import type { Confidence } from "@/types/prediction";

export const isStaleObservation = (observedAt: string, now = new Date()) =>
  now.getTime() - new Date(observedAt).getTime() > 48 * 60 * 60 * 1000;

export function calculateConfidence(
  observation: MarineObservation,
  now = new Date(),
): Confidence {
  const available = [
    observation.waterTemperature,
    observation.windSpeed,
    observation.waveHeight,
    observation.currentSpeed,
  ].filter((value) => value !== null).length;

  if (observation.waterTemperature === null || available <= 2 || isStaleObservation(observation.observedAt, now)) return "low";
  if (available === 3) return "medium";
  return "high";
}
