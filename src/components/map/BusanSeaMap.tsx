"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculatePredictions } from "@/lib/prediction/calculate-fish-score";
import { useMarineObservations } from "@/hooks/useMarineObservations";
import type { MarineObservation } from "@/types/marine";
import type { SuitabilityLevel } from "@/types/prediction";
import { AreaBottomSheet } from "./AreaBottomSheet";

const colors: Record<SuitabilityLevel, string> = {
  "very-high": "#1458b8",
  high: "#1687c4",
  medium: "#eab308",
  low: "#f97316",
  "very-low": "#94a3b8",
};

export default function BusanSeaMap() {
  const [selected, setSelected] = useState<MarineObservation | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const { observations, source, loading } = useMarineObservations();
  const predictionMap = useMemo(() => new Map(observations.map((observation) => [observation.areaId, calculatePredictions(observation)])), [observations]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    void import("leaflet").then((L) => {
      if (cancelled || !mapElementRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapElementRef.current, {
        center: [35.12, 129.08],
        zoom: 10,
        minZoom: 9,
        scrollWheelZoom: true,
        zoomControl: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      resizeObserver = new ResizeObserver(() => map.invalidateSize({ animate: false }));
      resizeObserver.observe(mapElementRef.current);
      requestAnimationFrame(() => map.invalidateSize({ animate: false }));
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const markerLayer = markerLayerRef.current;
    if (!mapReady || !L || !markerLayer) return;
    markerLayer.clearLayers();

    observations.forEach((observation) => {
      const top = predictionMap.get(observation.areaId)?.[0];
      if (!top) return;
      const insufficient = observation.waterTemperature === null || top.confidence === "low";
      const marker = L.circleMarker([observation.latitude, observation.longitude], {
        radius: 13,
        color: "#fff",
        weight: 3,
        fillColor: insufficient ? "#94a3b8" : colors[top.level],
        fillOpacity: 1,
      });
      const tooltip = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = observation.areaName;
      tooltip.append(title, document.createElement("br"));
      tooltip.append(`수온 ${observation.waterTemperature === null ? "없음" : `${observation.waterTemperature}°C`}`);
      tooltip.append(document.createElement("br"));
      tooltip.append(insufficient ? "데이터 부족" : `${top.fishName} · ${top.suitabilityScore}점`);
      marker.bindTooltip(tooltip, { direction: "top", offset: [0, -10], opacity: 1 });
      marker.on("click", () => setSelected(observation));
      marker.addTo(markerLayer);
    });
  }, [mapReady, observations, predictionMap]);

  return <div className="map-wrap"><div ref={mapElementRef} className="sea-map" role="application" aria-label="부산 앞바다 해역 지도" />{!mapReady && <div className="map-loading" role="status">지도를 불러오는 중입니다.</div>}<div className="map-source">{loading ? "관측 데이터 갱신 중" : source === "live" ? "최신 관측 데이터" : "예시 데이터"}</div><div className="map-legend"><b>환경 적합도</b><span><i className="bg-blue-700" />매우 높음</span><span><i className="bg-sky-500" />높음</span><span><i className="bg-yellow-500" />보통</span><span><i className="bg-orange-500" />낮음</span><span><i className="bg-slate-400" />데이터 부족</span></div><div className="map-area-buttons" aria-label="해역 바로 선택">{observations.map((observation) => <button key={observation.areaId} onClick={() => setSelected(observation)}>{observation.areaName}</button>)}</div>{selected && <AreaBottomSheet observation={selected} predictions={predictionMap.get(selected.areaId)!} onClose={() => setSelected(null)} />}</div>;
}
