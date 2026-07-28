"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FishPrediction, ScoreKey } from "@/types/prediction";

const labels: Record<ScoreKey, string> = { temperature: "수온", season: "계절", wind: "풍속", wave: "파고", current: "조류" };

export function SuitabilityChart({ prediction }: { prediction: FishPrediction }) {
  const data = (Object.entries(prediction.componentScores) as [ScoreKey, number][]).map(([key, score]) => ({ name: labels[key], score }));
  return <div><div className="h-56" aria-label="항목별 적합도 막대 차트"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ left: -24, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tickLine={false} /><YAxis domain={[0, 100]} tickLine={false} /><Tooltip formatter={(value) => [`${value}점`, "적합도"]} /><Bar dataKey="score" fill="#087ca7" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div><ul className="sr-only">{data.map((item) => <li key={item.name}>{item.name} {item.score}점</li>)}</ul></div>;
}
