import { CalendarClock, CloudSun, Compass, Droplets, Thermometer, Waves, Wind } from "lucide-react";
import { formatDateTime, formatValue } from "@/lib/formatters";
import type { MarineObservation } from "@/types/marine";

const items = (observation: MarineObservation) => [
  { label: "현재 수온", value: formatValue(observation.waterTemperature, "°C"), icon: Thermometer },
  { label: "바람", value: observation.windSpeed === null ? "데이터 없음" : `${observation.windDirection ?? "방향 미상"} ${observation.windSpeed.toFixed(1)}m/s`, icon: Wind },
  { label: "파고", value: formatValue(observation.waveHeight, "m"), icon: Waves },
  { label: "조류·유속", value: formatValue(observation.currentSpeed, "m/s"), icon: Droplets },
  { label: "날씨", value: observation.weather ?? "데이터 없음", icon: CloudSun },
  { label: "데이터 기준", value: formatDateTime(observation.observedAt), icon: CalendarClock },
];

export function MarineSummary({ observation }: { observation: MarineObservation }) {
  return <section aria-labelledby="marine-summary-title"><div className="section-heading"><div><p className="eyebrow"><Compass size={14} />선택 해역</p><h2 id="marine-summary-title">{observation.areaName}</h2>{observation.stationName && <p className="mt-1 text-xs text-slate-500">가장 가까운 관측소: {observation.stationName}</p>}</div><span className="live-dot"><span />{observation.source === "live" ? "최신 관측" : "예시 관측"}</span></div><div className="summary-grid">{items(observation).map(({ label, value, icon: Icon }) => <div className="metric-card" key={label}><Icon size={19} aria-hidden /><div><p>{label}</p><strong>{value}</strong></div></div>)}</div></section>;
}
