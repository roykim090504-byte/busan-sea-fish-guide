"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SEA_AREA_BOUNDARIES } from "@/data/sea-area-boundaries";
import { calculatePredictions } from "@/lib/prediction/calculate-fish-score";
import { useMarineObservations } from "@/hooks/useMarineObservations";
import type { MarineObservation } from "@/types/marine";
import type { SuitabilityLevel } from "@/types/prediction";
import { AreaBottomSheet } from "./AreaBottomSheet";

const LOW_TEMPERATURE_COLOR = [37, 99, 235] as const;
const HIGH_TEMPERATURE_COLOR = [239, 68, 68] as const;

const AREA_LEVEL_COLORS: Record<SuitabilityLevel, string> = {
  "very-high": "#1d4ed8",
  high: "#2563eb",
  medium: "#eab308",
  low: "#f97316",
  "very-low": "#94a3b8",
};

function getWaterTemperatureColor(
  temperature: number,
  min: number,
  max: number,
) {
  const ratio =
    min === max
      ? 0.5
      : Math.min(1, Math.max(0, (temperature - min) / (max - min)));
  const [red, green, blue] = LOW_TEMPERATURE_COLOR.map((channel, index) =>
    Math.round(
      channel + (HIGH_TEMPERATURE_COLOR[index] - channel) * ratio,
    ),
  );
  return `rgb(${red}, ${green}, ${blue})`;
}

export default function BusanSeaMap() {
  const [selected, setSelected] = useState<MarineObservation | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const regionLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const { observations, source, loading } = useMarineObservations();

  const predictionMap = useMemo(
    () =>
      new Map(
        observations.map((observation) => [
          observation.areaId,
          calculatePredictions(observation),
        ]),
      ),
    [observations],
  );

  const temperatureRange = useMemo(() => {
    const temperatures = observations.flatMap((observation) =>
      observation.waterTemperature === null
        ? []
        : [observation.waterTemperature],
    );
    return temperatures.length === 0
      ? null
      : {
          min: Math.min(...temperatures),
          max: Math.max(...temperatures),
        };
  }, [observations]);

  const selectObservation = useCallback(
    (observation: MarineObservation, moveMap = false) => {
      setSelected(observation);
      if (moveMap) {
        const currentZoom = mapRef.current?.getZoom() ?? 10;
        mapRef.current?.flyTo(
          [observation.latitude, observation.longitude],
          Math.max(currentZoom, 11),
          { duration: 0.5 },
        );
      }
    },
    [],
  );

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
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);

      regionLayerRef.current = L.layerGroup().addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      resizeObserver = new ResizeObserver(() =>
        map.invalidateSize({ animate: false }),
      );
      resizeObserver.observe(mapElementRef.current);
      requestAnimationFrame(() => map.invalidateSize({ animate: false }));
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      regionLayerRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const regionLayer = regionLayerRef.current;
    const markerLayer = markerLayerRef.current;
    if (!mapReady || !L || !regionLayer || !markerLayer) return;

    regionLayer.clearLayers();
    markerLayer.clearLayers();
    const boundaryMap = new Map(
      SEA_AREA_BOUNDARIES.map((boundary) => [
        boundary.areaId,
        boundary.coordinates,
      ]),
    );

    observations.forEach((observation) => {
      const predictions = predictionMap.get(observation.areaId);
      const top = predictions?.[0];
      const coordinates = boundaryMap.get(observation.areaId);
      if (!top || !coordinates) return;

      const isSelected = selected?.areaId === observation.areaId;
      const polygon = L.polygon(coordinates, {
        color: isSelected ? "#082f49" : "#0c4a6e",
        weight: isSelected ? 5 : 3,
        fillColor: AREA_LEVEL_COLORS[top.level],
        fillOpacity: isSelected ? 0.48 : 0.3,
        opacity: 1,
        lineJoin: "round",
      }).addTo(regionLayer);

      const regionTooltip = document.createElement("div");
      const regionTitle = document.createElement("strong");
      regionTitle.textContent = observation.areaName;
      regionTooltip.append(regionTitle, document.createElement("br"));
      regionTooltip.append(
        `추천 ${top.fishName} · 환경 적합도 ${top.suitabilityScore}점`,
      );
      regionTooltip.append(document.createElement("br"));
      regionTooltip.append("영역을 선택하면 상세 정보가 열립니다.");
      polygon.bindTooltip(regionTooltip, {
        sticky: true,
        opacity: 1,
      });
      polygon.on("click", () => selectObservation(observation));

      const polygonElement = polygon.getElement();
      if (polygonElement) {
        polygonElement.setAttribute("role", "button");
        polygonElement.setAttribute("tabindex", "0");
        polygonElement.setAttribute(
          "aria-label",
          `${observation.areaName} 해역 선택`,
        );
        polygonElement.setAttribute(
          "aria-pressed",
          String(isSelected),
        );
        polygonElement.addEventListener("keydown", (event) => {
          const keyboardEvent = event as KeyboardEvent;
          if (
            keyboardEvent.key === "Enter" ||
            keyboardEvent.key === " "
          ) {
            keyboardEvent.preventDefault();
            selectObservation(observation);
          }
        });
      }

      const waterTemperature = observation.waterTemperature;
      const hasTemperature =
        waterTemperature !== null && temperatureRange !== null;
      const marker = L.circleMarker(
        [observation.latitude, observation.longitude],
        {
          radius: isSelected ? 15 : 12,
          color: isSelected ? "#082f49" : "#ffffff",
          weight: isSelected ? 4 : 3,
          fillColor: hasTemperature
            ? getWaterTemperatureColor(
                waterTemperature,
                temperatureRange.min,
                temperatureRange.max,
              )
            : "#94a3b8",
          fillOpacity: 1,
        },
      );

      const markerTooltip = document.createElement("div");
      const markerTitle = document.createElement("strong");
      markerTitle.textContent = observation.areaName;
      markerTooltip.append(markerTitle, document.createElement("br"));
      markerTooltip.append(
        `수온 ${
          observation.waterTemperature === null
            ? "자료 없음"
            : `${observation.waterTemperature}°C`
        }`,
      );
      markerTooltip.append(document.createElement("br"));
      markerTooltip.append(
        `${top.fishName} · 환경 적합도 ${top.suitabilityScore}점`,
      );
      marker.bindTooltip(markerTooltip, {
        direction: "top",
        offset: [0, -10],
        opacity: 1,
      });
      marker.on("click", () => selectObservation(observation));
      marker.addTo(markerLayer);
    });
  }, [
    mapReady,
    observations,
    predictionMap,
    selected?.areaId,
    selectObservation,
    temperatureRange,
  ]);

  return (
    <div className="map-wrap">
      <div
        ref={mapElementRef}
        className="sea-map"
        role="application"
        aria-label="부산 앞바다 해역 구분 지도"
      />
      {!mapReady && (
        <div className="map-loading" role="status">
          지도를 불러오는 중입니다.
        </div>
      )}

      <div className="map-source">
        {loading
          ? "관측 데이터 갱신 중"
          : source === "live"
            ? "최신 관측 데이터"
            : "예시 데이터"}
      </div>

      <div className="map-legend">
        <b>해역 영역</b>
        <span>
          <i className="area-status-very-high" />
          매우 높음
        </span>
        <span>
          <i className="area-status-high" />
          높음
        </span>
        <span>
          <i className="area-status-medium" />
          보통
        </span>
        <span>
          <i className="area-status-low" />
          낮음
        </span>
        <small>영역 색상은 최고 어종의 환경 적합도입니다.</small>
        <b>표시점 수온</b>
        <div className="temperature-gradient" aria-hidden="true" />
        <div className="temperature-labels">
          <span>
            {temperatureRange ? `${temperatureRange.min}°C` : "저수온"}
          </span>
          <span>
            {temperatureRange ? `${temperatureRange.max}°C` : "고수온"}
          </span>
        </div>
        <span>
          <i className="temperature-missing" />
          수온 자료 없음
        </span>
        <small>해역 영역은 해안선을 따라 나눈 참고 범위입니다.</small>
      </div>

      <div className="map-area-buttons" aria-label="해역 바로 선택">
        {observations.map((observation) => (
          <button
            type="button"
            className={
              selected?.areaId === observation.areaId ? "active" : ""
            }
            aria-pressed={selected?.areaId === observation.areaId}
            key={observation.areaId}
            onClick={() => selectObservation(observation, true)}
          >
            {observation.areaName}
          </button>
        ))}
      </div>

      {selected && (
        <AreaBottomSheet
          observation={selected}
          predictions={predictionMap.get(selected.areaId) ?? []}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
