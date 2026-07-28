"use client";

import { useMemo, useState } from "react";
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { calculatePredictions } from "@/lib/prediction/calculate-fish-score";
import { useMarineObservations } from "@/hooks/useMarineObservations";
import type { MarineObservation } from "@/types/marine";
import { AreaMarker } from "./AreaMarker";
import { AreaBottomSheet } from "./AreaBottomSheet";

export default function BusanSeaMap() {
  const [selected, setSelected] = useState<MarineObservation | null>(null);
  const { observations, source, loading } = useMarineObservations();
  const predictionMap = useMemo(() => new Map(observations.map((observation) => [observation.areaId, calculatePredictions(observation)])), [observations]);
  return <div className="map-wrap"><MapContainer center={[35.12, 129.08]} zoom={10} minZoom={9} scrollWheelZoom zoomControl={false} className="sea-map" aria-label="부산 앞바다 해역 지도"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><ZoomControl position="topright" />{observations.map((observation) => <AreaMarker key={observation.areaId} observation={observation} top={predictionMap.get(observation.areaId)![0]} onSelect={() => setSelected(observation)} />)}</MapContainer><div className="map-source">{loading ? "관측 데이터 갱신 중" : source === "live" ? "최신 관측 데이터" : "예시 데이터"}</div><div className="map-legend"><b>환경 적합도</b><span><i className="bg-blue-700" />매우 높음</span><span><i className="bg-sky-500" />높음</span><span><i className="bg-yellow-500" />보통</span><span><i className="bg-orange-500" />낮음</span><span><i className="bg-slate-400" />데이터 부족</span></div>{selected && <AreaBottomSheet observation={selected} predictions={predictionMap.get(selected.areaId)!} onClose={() => setSelected(null)} />}</div>;
}
