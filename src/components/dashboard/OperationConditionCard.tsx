import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
  Wind,
  Waves,
  Navigation,
  CloudSun,
} from "lucide-react";
import { calculateOperationCondition } from "@/lib/operation/calculate-operation-condition";
import type { MarineObservation } from "@/types/marine";
import type { OperationConditionLevel } from "@/types/operation";

const LEVELS: Array<{ level: OperationConditionLevel; label: string }> = [
  { level: "very-good", label: "매우 양호" },
  { level: "good", label: "양호" },
  { level: "caution", label: "주의" },
  { level: "difficult", label: "어려움" },
  { level: "reconsider", label: "재검토" },
];

const LEVEL_ICON = {
  "very-good": ShieldCheck,
  good: CheckCircle2,
  caution: CircleAlert,
  difficult: AlertTriangle,
  reconsider: Ban,
} satisfies Record<OperationConditionLevel, typeof ShieldCheck>;

export function OperationConditionCard({ observation }: { observation: MarineObservation }) {
  const condition = calculateOperationCondition(observation);
  const StatusIcon = LEVEL_ICON[condition.level];
  const metrics = [
    { label: "바람", score: condition.componentScores.wind, icon: Wind },
    { label: "파고", score: condition.componentScores.wave, icon: Waves },
    { label: "조류", score: condition.componentScores.current, icon: Navigation },
    { label: "날씨", score: condition.componentScores.weather, icon: CloudSun },
  ];

  return <section className={`operation-card operation-${condition.level}`} aria-labelledby="operation-condition-title"><div className="operation-main"><div className="operation-icon"><StatusIcon size={30} aria-hidden /></div><div><p className="eyebrow">조업 환경 참고 지표 · 5단계</p><h2 id="operation-condition-title">{observation.areaName}은 현재 <strong>{condition.label}</strong></h2><p>{condition.summary}</p></div><div className="operation-score" aria-label={`환경 참고 점수 ${condition.score}점`}><strong>{condition.score}</strong><span>/ 100</span></div></div><div className="operation-scale" aria-label={`현재 5단계 중 ${condition.label}`} role="img">{LEVELS.map((item) => <span className={`operation-scale-${item.level}${item.level === condition.level ? " active" : ""}`} key={item.level}><i aria-hidden />{item.label}</span>)}</div><div className="operation-content"><div className="operation-metrics">{metrics.map(({ label, score, icon: Icon }) => <div key={label}><Icon size={17} aria-hidden /><span>{label}</span><strong>{score.toFixed(1)}점</strong></div>)}</div><div className="operation-reasons"><h3>판단 근거</h3><ul>{condition.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>{condition.warnings.map((warning) => <p key={warning}><AlertTriangle size={14} aria-hidden />{warning}</p>)}</div></div><div className="operation-disclaimer">이 단계는 현재 제공된 해양 환경만을 이용한 참고 지표이며 출항 허가나 안전 보장이 아닙니다. 선박 규모·장비·승선원·항만 통제와 기상특보를 함께 확인하고 최종 판단은 선장과 관계기관의 지침을 따르세요. <a href="https://www.kma.go.kr/kma/biz/forecast03.jsp" target="_blank" rel="noreferrer">기상청 특보 기준 확인</a></div></section>;
}
