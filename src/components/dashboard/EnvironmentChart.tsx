"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  calculateTrendAverage,
  createTwoHourTrend,
  type EnvironmentMetricKey,
} from "@/lib/environment/create-two-hour-trend";
import type { MarineObservation } from "@/types/marine";

type MetricConfig = {
  key: EnvironmentMetricKey;
  label: string;
  unit: string;
  color: string;
  decimals: number;
};

const METRICS: MetricConfig[] = [
  { key: "waterTemperature", label: "수온", unit: "°C", color: "#2563eb", decimals: 1 },
  { key: "windSpeed", label: "풍속", unit: "m/s", color: "#0891b2", decimals: 1 },
  { key: "waveHeight", label: "파고", unit: "m", color: "#7c3aed", decimals: 1 },
  { key: "currentSpeed", label: "조류", unit: "m/s", color: "#ea580c", decimals: 1 },
];

function MetricLineChart({ observation, metric }: { observation: MarineObservation; metric: MetricConfig }) {
  const data = createTwoHourTrend(observation, metric.key);
  const average = calculateTrendAverage(data, metric.decimals);
  const latest = observation[metric.key];

  return <article className="environment-chart-card" aria-labelledby={`${metric.key}-chart-title`}><div className="environment-chart-header"><div><p>{metric.label}</p><h3 id={`${metric.key}-chart-title`}>{average === null ? "평균 데이터 없음" : `평균 ${average}${metric.unit}`}</h3></div><span style={{ color: metric.color }}>{latest === null ? "현재값 없음" : `현재 ${latest}${metric.unit}`}</span></div>{data.length === 0 ? <div className="chart-empty">표시할 {metric.label} 데이터가 없습니다.</div> : <><div className="environment-line-chart" aria-label={`${metric.label} 2시간 간격 선그래프`}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -16 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce8ed" /><XAxis dataKey="time" interval={1} tickLine={false} axisLine={false} fontSize={11} /><YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} fontSize={11} width={44} /><Tooltip formatter={(value) => [`${value}${metric.unit}`, metric.label]} labelFormatter={(label) => `${label} 기준`} /><ReferenceLine y={average ?? undefined} stroke={metric.color} strokeDasharray="4 4" strokeOpacity={0.45} /><Line type="monotone" dataKey="value" name={metric.label} stroke={metric.color} strokeWidth={3} dot={{ r: 2, fill: metric.color, strokeWidth: 0 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div><p className="chart-average-note"><i style={{ background: metric.color }} />점선은 24시간 참고 평균 {average}{metric.unit}입니다.</p><ul className="sr-only">{data.map((point) => <li key={point.observedAt}>{point.time} {point.value}{metric.unit}</li>)}</ul></>}</article>;
}

export function EnvironmentChart({ observation }: { observation: MarineObservation }) {
  return <section className="surface-card mt-6" aria-labelledby="environment-chart-title"><div className="section-heading"><div><p className="eyebrow">데이터 시각화</p><h2 id="environment-chart-title">24시간 해양 환경 추세</h2><p className="chart-description">수온·풍속·파고·조류를 각각 독립된 눈금으로 표시합니다.</p></div></div><div className="environment-chart-grid">{METRICS.map((metric) => <MetricLineChart key={metric.key} observation={observation} metric={metric} />)}</div><p className="chart-prototype-note">2시간 간격 추세와 평균은 최신 관측값을 기준으로 구성한 프로토타입용 참고 패턴이며, 실제 과거 관측 기록이 아닙니다.</p></section>;
}
