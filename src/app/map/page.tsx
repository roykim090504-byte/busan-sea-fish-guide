import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Waves } from "lucide-react";
import { LoadingSkeleton } from "@/components/common/LoadingSkeleton";

const BusanSeaMap = dynamic(() => import("@/components/map/BusanSeaMap"), { ssr: false, loading: () => <LoadingSkeleton /> });
export default function MapPage() {
  return <main className="map-page"><header className="sub-header"><Link href="/" className="icon-link" aria-label="첫 화면으로 돌아가기"><ArrowLeft /></Link><div><p className="eyebrow"><Waves size={14} />BUSAN SEA MAP</p><h1>부산 앞바다 지도</h1><p>마커를 눌러 최신 관측 환경과 예상 어종을 확인하세요.</p></div></header><div className="prototype-banner">국립해양조사원·기상청 관측 API를 사용하며, 연결 실패 시 예시 데이터로 전환됩니다.</div><BusanSeaMap /></main>;
}
