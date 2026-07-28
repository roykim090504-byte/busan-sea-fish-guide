"use client";

import Link from "next/link";
import { ArrowLeft, Fish, Map } from "lucide-react";
import { getSeaArea } from "@/data/sea-areas";
import { useMarineObservations } from "@/hooks/useMarineObservations";
import { calculatePredictions } from "@/lib/prediction/calculate-fish-score";
import { FishRanking } from "@/components/fish/FishRanking";
import { MarineSummary } from "@/components/dashboard/MarineSummary";
import { DataWarning } from "@/components/common/DataWarning";

export function LiveAreaDetail({ areaId }: { areaId: string }) {
  const area = getSeaArea(areaId);
  const { observations, source, warnings, loading } = useMarineObservations();
  const observation = observations.find((item) => item.areaId === areaId);
  if (!area || !observation) return <main className="empty-page"><Fish size={44} /><h1>해역을 찾을 수 없습니다</h1><p>주소를 확인하거나 첫 화면에서 해역을 다시 선택해 주세요.</p><Link className="primary-button" href="/">첫 화면으로</Link></main>;
  const predictions = calculatePredictions(observation);
  return <main><header className="sub-header"><Link href="/" className="icon-link" aria-label="첫 화면으로 돌아가기"><ArrowLeft /></Link><div><p className="eyebrow">전체 어종 분석</p><h1>{area.name}</h1><p>12개 대상 어종의 규칙 기반 환경 적합도 순위입니다.</p></div><Link className="outline-button ml-auto" href="/map"><Map size={17} />지도 보기</Link></header><div className="prototype-banner">{loading ? "최신 관측 데이터를 불러오는 중입니다." : source === "live" ? "국립해양조사원·기상청 최신 관측 데이터를 사용합니다." : "실시간 연결 실패로 예시 데이터를 표시합니다."}</div><div className="page-shell"><MarineSummary observation={observation} />{warnings.map((warning) => <DataWarning key={warning}>{warning}</DataWarning>)}{predictions[0].warnings.map((warning) => <DataWarning key={warning}>{warning}</DataWarning>)}<FishRanking predictions={predictions} /><p className="disclaimer">이 결과는 수온, 풍속, 파고, 조류, 계절 등의 해양 환경 데이터를 이용한 참고용 예측입니다. 실제 어획 여부는 지역, 장비, 조업 방식, 날씨 변화 등 다양한 요인에 따라 달라질 수 있습니다.</p></div></main>;
}
