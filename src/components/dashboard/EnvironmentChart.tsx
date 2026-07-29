"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EnvironmentMetricKey } from "@/lib/environment/create-two-hour-trend";
import type { MarineHistoryPoint, MarineObservation } from "@/types/marine";

type MetricConfig = {
  key: EnvironmentMetricKey;
  label: string;
  unit: string;
  color: string;
};

const METRICS: MetricConfig[] = [
  { key: "waterTemperature", label: "수온", unit: "°C", color: "#2563eb" },
  { key: "windSpeed", label: "풍속", unit: "m/s", color: "#0891b2" },
  { key: "waveHeight", label: "파고", unit: "m", color: "#7c3aed" },
  { key: "currentSpeed", label: "조류", unit: "m/s", color: "#ea580c" },
];

const formatForDisplay = (value: number) => value.toFixed(1);

const formatKstTime = (observedAt: string) => new Intl.DateTimeFormat("ko-KR", {
  hour: "numeric", hour12: false, timeZone: "Asia/Seoul",
}).format(new Date(observedAt));

const chartDomain = (metric: EnvironmentMetricKey, values: number[]): [number | "auto", number | "auto"] => {
  if (values.length === 0 || (metric !== "waterTemperature" && metric !== "waveHeight")) return ["auto", "auto"];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = metric === "waterTemperature"
    ? Math.max(0.5, (maximum - minimum) * 0.3)
    : Math.max(0.05, (maximum - minimum) * 0.5);
  const precision = metric === "waterTemperature" ? 2 : 10;
  return [
    Math.max(0, Math.floor((minimum - padding) * precision) / precision),
    Math.ceil((maximum + padding) * precision) / precision,
  ];
};

function MetricLineChart({ observation, history, metric }: { observation: MarineObservation; history: MarineHistoryPoint[]; metric: MetricConfig }) {
  const data = history.map((point) => ({ observedAt: point.observedAt, time: formatKstTime(point.observedAt), value: point[metric.key] }));
  const values = data.flatMap((point) => point.value === null ? [] : [point.value]);
  const average = values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
  const yDomain = chartDomain(metric.key, values);
  const latest = observation[metric.key];
  const averageLabel = average === null ? null : formatForDisplay(average);
  const latestLabel = latest === null ? null : formatForDisplay(latest);

  return <article className="environment-chart-card" aria-labelledby={`${metric.key}-chart-title`}><div className="environment-chart-header"><div><p>{metric.label}</p><h3 id={`${metric.key}-chart-title`}>{averageLabel === null ? "평균 데이터 없음" : `평균 ${averageLabel}${metric.unit}`}</h3></div><span style={{ color: metric.color }}>{latestLabel === null ? "현재값 없음" : `현재 ${latestLabel}${metric.unit}`}</span></div>{values.length === 0 ? <div className="chart-empty">표시할 {metric.label} 데이터가 없습니다.</div> : <><div className="environment-line-chart" aria-label={`${metric.label} 2시간 간격 선그래프`}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -16 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce8ed" /><XAxis dataKey="time" interval={1} tickLine={false} axisLine={false} fontSize={11} /><YAxis domain={yDomain} tickLine={false} axisLine={false} fontSize={11} width={44} /><Tooltip formatter={(value) => [`${formatForDisplay(Number(value))}${metric.unit}`, metric.label]} labelFormatter={(label) => `${label} 기준`} /><ReferenceLine y={average ?? undefined} stroke={metric.color} strokeDasharray="4 4" strokeOpacity={0.45} /><Line type="monotone" dataKey="value" name={metric.label} connectNulls={false} stroke={metric.color} strokeWidth={3} dot={{ r: 2, fill: metric.color, strokeWidth: 0 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div><p className="chart-average-note"><i style={{ background: metric.color }} />점선은 24시간 참고 평균 {averageLabel}{metric.unit}입니다.</p><ul className="sr-only">{data.filter((point) => point.value !== null).map((point) => <li key={point.observedAt}>{point.time} {formatForDisplay(point.value as number)}{metric.unit}</li>)}</ul></>}</article>;
}

export function EnvironmentChart({ observation, history }: { observation: MarineObservation; history: MarineHistoryPoint[] }) {
  return <section className="surface-card mt-6" aria-labelledby="environment-chart-title"><div className="section-heading"><div><p className="eyebrow">데이터 시각화</p><h2 id="environment-chart-title">24시간 해양 환경 추세</h2><p className="chart-description">기상청·국립해양조사원 실제 시간별 관측 기록입니다.</p></div></div><div className="environment-chart-grid">{METRICS.map((metric) => <MetricLineChart key={metric.key} observation={observation} history={history} metric={metric} />)}</div><p className="chart-prototype-note">수온·풍속·파고는 기상청 해양 관측, 조류는 국립해양조사원 해양관측부이 기록을 사용합니다.</p></section>;
}
