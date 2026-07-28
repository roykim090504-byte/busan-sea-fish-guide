"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Fish, Map, Waves } from "lucide-react";
import { DEFAULT_AREA_ID } from "@/data/sea-areas";
import { calculatePredictions } from "@/lib/prediction/calculate-fish-score";
import { isStaleObservation } from "@/lib/prediction/calculate-confidence";
import { useMarineObservations } from "@/hooks/useMarineObservations";
import { AreaSelector } from "./AreaSelector";
import { MarineSummary } from "./MarineSummary";
import { TopFishCards } from "../fish/TopFishCards";
import { EnvironmentChart } from "./EnvironmentChart";
import { DataWarning } from "../common/DataWarning";
import { OperationConditionCard } from "./OperationConditionCard";
import { MarineEmergencyPanel } from "./MarineEmergencyPanel";

export function Dashboard() {
  const [areaId, setAreaId] = useState(DEFAULT_AREA_ID);
  const { observations, source, warnings, loading } = useMarineObservations();
  const observation = observations.find((item) => item.areaId === areaId) ?? observations[0];
  const predictions = useMemo(() => calculatePredictions(observation), [observation]);
  const hasMissing = [observation.waterTemperature, observation.windSpeed, observation.waveHeight, observation.currentSpeed].some((value) => value === null);
  return <main><header className="hero"><nav className="nav-shell" aria-label="주요 메뉴"><Link className="brand" href="/"><span><Waves /></span>부산 바다예보</Link><div><Link href="/map"><Map size={17} />지도</Link><Link href={`/area/${areaId}`}><Fish size={17} />전체 순위</Link></div></nav><div className="hero-content"><div><p className="hero-kicker">BUSAN SEA GUIDE</p><h1>오늘의 부산 앞바다</h1><p>부산 해역의 수온, 바람, 파도, 조류를 분석하여 어종별 환경 적합도를 보여 줍니다.</p></div><div className="hero-actions"><AreaSelector value={areaId} onChange={setAreaId} /><Link className="primary-button" href="/map"><Map size={20} />지도 보기</Link></div></div></header><div className="prototype-banner">{loading ? "최신 해양·기상 관측 데이터를 불러오는 중입니다." : source === "live" ? "국립해양조사원 해양관측부이와 기상청 최신 관측 데이터를 사용합니다." : "실시간 연결이 원활하지 않아 예시 데이터를 표시하고 있습니다."}</div><div className="page-shell">{warnings.map((warning) => <DataWarning key={warning}>{warning}</DataWarning>)}{hasMissing && <DataWarning>일부 해양 데이터가 제공되지 않아 제한된 정보만으로 계산했습니다.</DataWarning>}{isStaleObservation(observation.observedAt) && <DataWarning>현재 표시된 정보는 최신 관측 데이터가 아닐 수 있습니다.</DataWarning>}<MarineSummary observation={observation} /><OperationConditionCard observation={observation} /><TopFishCards predictions={predictions} observation={observation} /><MarineEmergencyPanel observation={observation} /><EnvironmentChart observation={observation} /><Link className="wide-link" href={`/area/${areaId}`}>12개 전체 어종 순위 보기<span>→</span></Link><p className="disclaimer">이 결과는 수온, 풍속, 파고, 조류, 계절 등의 해양 환경 데이터를 이용한 참고용 예측입니다. 실제 어획 여부는 지역, 장비, 조업 방식, 날씨 변화 등 다양한 요인에 따라 달라질 수 있습니다.</p></div></main>;
}
