"use client";

import { CircleMarker, Tooltip } from "react-leaflet";
import type { MarineObservation } from "@/types/marine";
import type { FishPrediction } from "@/types/prediction";
import { LEVEL_LABELS } from "@/lib/formatters";

const colors = { "very-high": "#1458b8", high: "#1687c4", medium: "#eab308", low: "#f97316", "very-low": "#94a3b8" };
export function AreaMarker({ observation, top, onSelect }: { observation: MarineObservation; top: FishPrediction; onSelect: () => void }) {
  const insufficient = observation.waterTemperature === null || top.confidence === "low";
  return <CircleMarker center={[observation.latitude, observation.longitude]} radius={13} pathOptions={{ color: "#fff", weight: 3, fillColor: insufficient ? "#94a3b8" : colors[top.level], fillOpacity: 1 }} eventHandlers={{ click: onSelect }}><Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}><strong>{observation.areaName}</strong><br />수온 {observation.waterTemperature === null ? "없음" : `${observation.waterTemperature}°C`}<br />{insufficient ? "데이터 부족" : `${top.fishName} · ${LEVEL_LABELS[top.level]}`}</Tooltip></CircleMarker>;
}
