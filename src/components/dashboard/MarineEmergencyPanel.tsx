import {
  BellRing,
  CloudLightning,
  ExternalLink,
  Radio,
  ShieldCheck,
  TriangleAlert,
  Waves,
  Wind,
} from "lucide-react";
import { createMarineEmergencySummary, type MarineAlertKind, type MarineAlertSeverity } from "@/lib/alerts/create-marine-emergency-check";
import { formatDateTime } from "@/lib/formatters";
import type { MarineObservation } from "@/types/marine";

const ICONS = {
  advisory: Radio,
  wind: Wind,
  wave: Waves,
  weather: CloudLightning,
} satisfies Record<MarineAlertKind, typeof Radio>;

const STATUS_ICONS = {
  normal: ShieldCheck,
  watch: BellRing,
  warning: TriangleAlert,
  danger: TriangleAlert,
  unknown: BellRing,
} satisfies Record<MarineAlertSeverity, typeof BellRing>;

export function MarineEmergencyPanel({ observation }: { observation: MarineObservation }) {
  const summary = createMarineEmergencySummary(observation);
  const SummaryIcon = STATUS_ICONS[summary.severity];

  return <section className={`emergency-panel emergency-${summary.severity}`} aria-labelledby="marine-emergency-title"><header className="emergency-header"><div className="emergency-symbol"><SummaryIcon size={28} aria-hidden /></div><div><p className="eyebrow">해상 위급 상황 점검</p><h2 id="marine-emergency-title">{summary.label}</h2><p>{summary.description}</p></div><span>{formatDateTime(observation.observedAt)} 기준</span></header><div className="emergency-grid">{summary.checks.map((check) => { const Icon = ICONS[check.kind]; const StatusIcon = STATUS_ICONS[check.severity]; return <article className={`emergency-item emergency-item-${check.severity}`} key={check.kind}><div><Icon size={19} aria-hidden /><h3>{check.title}</h3></div><strong><StatusIcon size={15} aria-hidden />{check.status}</strong><p>{check.detail}</p></article>; })}</div>{summary.dataWarning && <p className="emergency-data-warning"><TriangleAlert size={15} aria-hidden />{summary.dataWarning}</p>}<footer>이 영역은 현재 관측값의 기준 도달 여부를 확인하는 참고 기능이며 실제 특보 발효 여부를 뜻하지 않습니다. <a href="https://www.kma.go.kr/kma/biz/forecast03.jsp" target="_blank" rel="noreferrer">기상청 특보 확인 <ExternalLink size={12} aria-hidden /></a></footer></section>;
}
