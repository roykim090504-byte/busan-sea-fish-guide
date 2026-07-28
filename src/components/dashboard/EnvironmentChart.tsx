"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarineObservation } from "@/types/marine";

export function EnvironmentChart({ observation }: { observation: MarineObservation }) {
  const data = [
    { name: "수온", value: observation.waterTemperature, unit: "°C" },
    { name: "풍속", value: observation.windSpeed, unit: "m/s" },
    { name: "파고", value: observation.waveHeight, unit: "m" },
    { name: "조류", value: observation.currentSpeed, unit: "m/s" },
  ].filter((item) => item.value !== null);
  return <section className="surface-card mt-6" aria-labelledby="environment-chart-title"><div className="section-heading"><div><p className="eyebrow">데이터 시각화</p><h2 id="environment-chart-title">해양 환경 한눈에 보기</h2></div></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip formatter={(value, _name, item) => [`${value}${item.payload.unit}`, "관측값"]} /><Bar dataKey="value" fill="#0d8cab" radius={[9,9,0,0]} /></BarChart></ResponsiveContainer></div><div className="chart-legend">{data.map((item) => <span key={item.name}><b>{item.name}</b> {item.value}{item.unit}</span>)}</div></section>;
}
