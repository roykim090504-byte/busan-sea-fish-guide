export type SeaArea = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type MarineObservation = {
  areaId: string;
  areaName: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  waterTemperature: number | null;
  airTemperature: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  waveHeight: number | null;
  currentSpeed: number | null;
  weather: string | null;
  source?: "live" | "sample";
  stationName?: string;
  supplementedMetrics?: string[];
};

export type MarineHistoryPoint = {
  observedAt: string;
  waterTemperature: number | null;
  windSpeed: number | null;
  waveHeight: number | null;
  currentSpeed: number | null;
};

export type MarineApiResponse = {
  observations: MarineObservation[];
  history: Record<string, MarineHistoryPoint[]>;
  source: "live" | "sample";
  fetchedAt: string;
  warnings: string[];
};
