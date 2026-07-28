import type { MarineObservation } from "@/types/marine";

export type MarineAlertSeverity = "normal" | "watch" | "warning" | "danger" | "unknown";
export type MarineAlertKind = "advisory" | "wind" | "wave" | "weather";

export type MarineAlertCheck = {
  kind: MarineAlertKind;
  title: string;
  severity: MarineAlertSeverity;
  status: string;
  detail: string;
};

export type MarineEmergencySummary = {
  severity: MarineAlertSeverity;
  label: string;
  description: string;
  checks: MarineAlertCheck[];
  dataWarning: string | null;
};

const SEVERITY_ORDER: Record<MarineAlertSeverity, number> = {
  normal: 0,
  watch: 1,
  unknown: 2,
  warning: 3,
  danger: 4,
};

const SUMMARY_CONTENT: Record<MarineAlertSeverity, { label: string; description: string }> = {
  normal: { label: "현재 관측상 위급 신호 없음", description: "현재 수치에서 강풍·높은 파도·위험 날씨 신호가 확인되지 않았습니다." },
  watch: { label: "주의 관찰 필요", description: "기상이 악화될 가능성을 고려해 현지 상황과 최신 예보를 계속 확인하세요." },
  warning: { label: "경계 필요", description: "강한 바람이나 높은 파도 등 위험 요인이 감지되었습니다." },
  danger: { label: "즉시 확인 필요", description: "풍랑주의보 기준 수준 또는 위험 날씨가 감지되어 공식 특보와 통제를 확인해야 합니다." },
  unknown: { label: "데이터 확인 필요", description: "핵심 데이터가 없거나 신뢰하기 어려워 위급 상황을 충분히 판단할 수 없습니다." },
};

const createAdvisoryCheck = (observation: MarineObservation): MarineAlertCheck => {
  const wind = observation.windSpeed;
  const wave = observation.waveHeight;
  if (wind === null && wave === null) {
    return { kind: "advisory", title: "풍랑주의보 기준", severity: "unknown", status: "판단 불가", detail: "풍속과 파고 데이터가 모두 없습니다." };
  }
  if ((wind !== null && wind >= 14) || (wave !== null && wave >= 3)) {
    return { kind: "advisory", title: "풍랑주의보 기준", severity: "danger", status: "기준 수준 도달", detail: "풍속 14m/s 또는 유의파고 3m 기준을 확인하세요." };
  }
  return { kind: "advisory", title: "풍랑주의보 기준", severity: "normal", status: "기준 미도달", detail: "현재 관측값은 수치 기준보다 낮습니다." };
};

const createWindCheck = (wind: number | null): MarineAlertCheck => {
  if (wind === null) return { kind: "wind", title: "강풍", severity: "unknown", status: "데이터 없음", detail: "현재 풍속을 확인할 수 없습니다." };
  if (wind >= 14) return { kind: "wind", title: "강풍", severity: "danger", status: "매우 강함", detail: `현재 풍속 ${wind}m/s · 풍랑주의보 기준 수준` };
  if (wind >= 9) return { kind: "wind", title: "강풍", severity: "warning", status: "강한 바람", detail: `현재 풍속 ${wind}m/s · 조업과 항해 주의` };
  if (wind >= 6) return { kind: "wind", title: "강풍", severity: "watch", status: "주의", detail: `현재 풍속 ${wind}m/s · 변화 관찰 필요` };
  return { kind: "wind", title: "강풍", severity: "normal", status: "보통", detail: `현재 풍속 ${wind}m/s` };
};

const createWaveCheck = (wave: number | null): MarineAlertCheck => {
  if (wave === null) return { kind: "wave", title: "높은 파도", severity: "unknown", status: "데이터 없음", detail: "현재 파고를 확인할 수 없습니다." };
  if (wave >= 3) return { kind: "wave", title: "높은 파도", severity: "danger", status: "매우 높음", detail: `현재 파고 ${wave}m · 풍랑주의보 기준 수준` };
  if (wave >= 2) return { kind: "wave", title: "높은 파도", severity: "warning", status: "높은 물결", detail: `현재 파고 ${wave}m · 선박 안전 주의` };
  if (wave >= 1.5) return { kind: "wave", title: "높은 파도", severity: "watch", status: "주의", detail: `현재 파고 ${wave}m · 변화 관찰 필요` };
  return { kind: "wave", title: "높은 파도", severity: "normal", status: "낮음", detail: `현재 파고 ${wave}m` };
};

const createWeatherCheck = (weather: string | null): MarineAlertCheck => {
  if (weather === null || weather.includes("미상")) {
    return { kind: "weather", title: "위험 날씨", severity: "unknown", status: "데이터 없음", detail: "현재 날씨 상태를 확인할 수 없습니다." };
  }
  if (/(태풍|폭풍|뇌우)/.test(weather)) {
    return { kind: "weather", title: "위험 날씨", severity: "danger", status: "위험", detail: `${weather} 상태가 감지되었습니다.` };
  }
  if (/(눈|비)/.test(weather) && !weather.includes("없음")) {
    return { kind: "weather", title: "위험 날씨", severity: "warning", status: "악천후 주의", detail: `${weather} 상태로 시야와 갑판 작업에 주의하세요.` };
  }
  if (weather.includes("흐림")) {
    return { kind: "weather", title: "위험 날씨", severity: "watch", status: "관찰", detail: `${weather} 상태입니다.` };
  }
  return { kind: "weather", title: "위험 날씨", severity: "normal", status: "특이사항 없음", detail: `현재 ${weather} 상태입니다.` };
};

export function createMarineEmergencySummary(
  observation: MarineObservation,
  now = new Date(),
): MarineEmergencySummary {
  const checks = [
    createAdvisoryCheck(observation),
    createWindCheck(observation.windSpeed),
    createWaveCheck(observation.waveHeight),
    createWeatherCheck(observation.weather),
  ];
  const observedTime = Date.parse(observation.observedAt);
  const ageHours = Number.isNaN(observedTime)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, (now.getTime() - observedTime) / (60 * 60 * 1000));
  const dataWarning = observation.source === "sample"
    ? "예시 데이터이므로 실제 위급 상황 판단에 사용할 수 없습니다."
    : ageHours > 6
      ? "관측 후 6시간 이상 지나 현재 상황과 다를 수 있습니다."
      : null;
  let severity = checks.reduce<MarineAlertSeverity>(
    (highest, check) => SEVERITY_ORDER[check.severity] > SEVERITY_ORDER[highest] ? check.severity : highest,
    "normal",
  );
  if (dataWarning && SEVERITY_ORDER[severity] < SEVERITY_ORDER.unknown) severity = "unknown";

  return {
    severity,
    ...SUMMARY_CONTENT[severity],
    checks,
    dataWarning,
  };
}
