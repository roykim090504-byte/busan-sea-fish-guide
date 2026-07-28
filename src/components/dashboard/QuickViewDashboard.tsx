"use client";

import type { CSSProperties } from "react";
import {
  AlertTriangle,
  Check,
  CloudSun,
  Compass,
  Fish,
  Gauge,
  MapPin,
  Navigation,
  ShieldAlert,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import { SEA_AREAS } from "@/data/sea-areas";
import { createMarineEmergencySummary } from "@/lib/alerts/create-marine-emergency-check";
import { formatDateTime } from "@/lib/formatters";
import { calculateOperationCondition } from "@/lib/operation/calculate-operation-condition";
import type { MarineObservation } from "@/types/marine";
import type { FishPrediction } from "@/types/prediction";

type QuickViewDashboardProps = {
  areaId: string;
  observation: MarineObservation;
  predictions: FishPrediction[];
  onAreaChange: (areaId: string) => void;
};

const metricWidth = (value: number | null, maximum: number) =>
  value === null ? 0 : Math.min(100, Math.max(4, (value / maximum) * 100));

const displayValue = (
  value: number | null,
  unit: string,
  digits = 1,
) => (value === null ? "자료 없음" : `${value.toFixed(digits)}${unit}`);

export function QuickViewDashboard({
  areaId,
  observation,
  predictions,
  onAreaChange,
}: QuickViewDashboardProps) {
  const operation = calculateOperationCondition(observation);
  const emergency = createMarineEmergencySummary(observation);
  const topFish = predictions.slice(0, 3);
  const missingCount = [
    observation.waterTemperature,
    observation.windSpeed,
    observation.waveHeight,
    observation.currentSpeed,
  ].filter((value) => value === null).length;

  const metrics = [
    {
      label: "수온",
      value: displayValue(observation.waterTemperature, "°C"),
      raw: observation.waterTemperature,
      maximum: 30,
      icon: Thermometer,
      color: "#ef4444",
    },
    {
      label: "풍속",
      value:
        observation.windSpeed === null
          ? "자료 없음"
          : `${observation.windSpeed.toFixed(1)}m/s`,
      detail: observation.windDirection ?? "풍향 자료 없음",
      raw: observation.windSpeed,
      maximum: 15,
      icon: Wind,
      color: "#1687a7",
    },
    {
      label: "파고",
      value: displayValue(observation.waveHeight, "m"),
      raw: observation.waveHeight,
      maximum: 4,
      icon: Waves,
      color: "#2563eb",
    },
    {
      label: "조류",
      value: displayValue(observation.currentSpeed, "m/s"),
      raw: observation.currentSpeed,
      maximum: 2,
      icon: Navigation,
      color: "#7c3aed",
    },
  ];

  return (
    <section className="quick-dashboard" aria-labelledby="quick-view-title">
      <aside className="quick-area-panel" aria-label="해역 빠른 선택">
        <div className="quick-area-title">
          <Compass size={20} aria-hidden />
          <div>
            <strong>부산 앞바다</strong>
            <span>해역 빠른 선택</span>
          </div>
        </div>
        <div className="quick-area-list">
          {SEA_AREAS.map((area) => (
            <button
              type="button"
              key={area.id}
              className={area.id === areaId ? "active" : ""}
              aria-pressed={area.id === areaId}
              onClick={() => onAreaChange(area.id)}
            >
              <Waves size={16} aria-hidden />
              <span>{area.name}</span>
              {area.id === areaId && <Check size={15} aria-hidden />}
            </button>
          ))}
        </div>
      </aside>

      <div className="quick-main">
        <header className="quick-location-card">
          <div>
            <p className="quick-label">
              <MapPin size={15} aria-hidden />
              현재 선택 해역
            </p>
            <h2 id="quick-view-title">{observation.areaName}</h2>
            <p>
              {formatDateTime(observation.observedAt)} 기준
              {observation.stationName
                ? ` · ${observation.stationName} 관측소 참고`
                : ""}
            </p>
          </div>
          <div className="quick-weather">
            <CloudSun size={24} aria-hidden />
            <span>현재 날씨</span>
            <strong>{observation.weather ?? "자료 없음"}</strong>
          </div>
        </header>

        <div className="quick-highlight-grid">
          <article
            className={`quick-guide quick-operation-${operation.level}`}
          >
            <div className="quick-card-heading">
              <Gauge size={20} aria-hidden />
              <h3>조업 환경</h3>
            </div>
            <div
              className="quick-score-ring"
              style={{ "--score": operation.score } as CSSProperties}
              aria-label={`조업 환경 참고 점수 ${operation.score}점`}
              role="img"
            >
              <div>
                <strong>{operation.score}</strong>
                <span>/ 100</span>
              </div>
            </div>
            <strong className="quick-status">{operation.label}</strong>
            <p>{operation.summary}</p>
          </article>

          <article
            className={`quick-emergency quick-emergency-${emergency.severity}`}
          >
            <div className="quick-card-heading">
              <ShieldAlert size={20} aria-hidden />
              <h3>해상 위급 상황</h3>
            </div>
            <strong className="quick-emergency-label">
              {emergency.label}
            </strong>
            <p>{emergency.description}</p>
            <ul>
              {emergency.checks.map((check) => (
                <li key={check.kind}>
                  <span>{check.title}</span>
                  <strong>{check.status}</strong>
                </li>
              ))}
            </ul>
          </article>

          <article className="quick-fish-panel">
            <div className="quick-card-heading">
              <Fish size={20} aria-hidden />
              <h3>추천 어종 TOP 3</h3>
            </div>
            <ol>
              {topFish.map((fish, index) => (
                <li key={fish.fishId}>
                  <span className="quick-rank">{index + 1}위</span>
                  <strong>{fish.fishName}</strong>
                  <div className="quick-fish-track" aria-hidden>
                    <span
                      style={{ width: `${fish.suitabilityScore}%` }}
                    />
                  </div>
                  <b>{fish.suitabilityScore}점</b>
                </li>
              ))}
            </ol>
            <p>
              실제 포획 확률이 아닌 해양 환경 적합도 환산값입니다.
            </p>
          </article>
        </div>

        <section className="quick-metrics" aria-labelledby="quick-metrics-title">
          <div className="quick-section-heading">
            <div>
              <p className="quick-label">현재 관측 한눈에 보기</p>
              <h3 id="quick-metrics-title">해양 환경 요약</h3>
            </div>
            <span>
              {missingCount > 0
                ? `${missingCount}개 항목 자료 부족`
                : "주요 자료 확인됨"}
            </span>
          </div>
          <div className="quick-metric-grid">
            {metrics.map(
              ({
                label,
                value,
                detail,
                raw,
                maximum,
                icon: Icon,
                color,
              }) => (
                <article key={label}>
                  <div>
                    <Icon size={21} aria-hidden style={{ color }} />
                    <span>{label}</span>
                  </div>
                  <strong>{value}</strong>
                  {detail && <p>{detail}</p>}
                  <div className="quick-metric-track" aria-hidden>
                    <span
                      style={{
                        width: `${metricWidth(raw, maximum)}%`,
                        background: color,
                      }}
                    />
                  </div>
                </article>
              ),
            )}
          </div>
        </section>

        <section className="quick-judgement" aria-labelledby="quick-guide-title">
          <div className="quick-section-heading">
            <div>
              <p className="quick-label">현재 자료 종합</p>
              <h3 id="quick-guide-title">간단 판단 근거</h3>
            </div>
            <AlertTriangle size={20} aria-hidden />
          </div>
          <div className="quick-judgement-grid">
            <div>
              <h4>조업 환경 판단</h4>
              <ul>
                {operation.reasons.slice(0, 3).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>예측 참고사항</h4>
              <p>
                이 화면은 현재 해양 환경 데이터를 빠르게 확인하기 위한
                간편 보기입니다. 출항 전에는 공식 기상특보와 현장 상황을
                반드시 함께 확인하세요.
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
