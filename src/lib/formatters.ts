import type { Confidence, SuitabilityLevel } from "@/types/prediction";
import { floorToWholeHour } from "@/lib/time/normalize-marine-time";

export const formatValue = (value: number | null, unit: string) =>
  value === null ? "데이터 없음" : `${value.toFixed(1)}${unit}`;

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long", day: "numeric", hour: "numeric", hour12: true, timeZone: "Asia/Seoul",
  }).format(new Date(floorToWholeHour(value)));

export const LEVEL_LABELS: Record<SuitabilityLevel, string> = {
  "very-high": "매우 높음", high: "높음", medium: "보통", low: "낮음", "very-low": "매우 낮음",
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: "높음", medium: "보통", low: "낮음",
};
