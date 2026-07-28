import Link from "next/link";
import { ArrowLeft, Waves } from "lucide-react";
import BusanSeaMap from "@/components/map/BusanSeaMap";

export default function MapPage() {
  return (
    <main className="map-page">
      <header className="sub-header">
        <Link href="/" className="icon-link" aria-label="첫 화면으로 돌아가기">
          <ArrowLeft />
        </Link>
        <div>
          <p className="eyebrow">
            <Waves size={14} />
            BUSAN SEA MAP
          </p>
          <h1>부산 앞바다 해역 지도</h1>
          <p>
            구분된 해역 영역이나 표시점을 선택해 관측 환경과 예상 어종을
            확인하세요.
          </p>
        </div>
      </header>
      <div className="prototype-banner">
        각 해역 영역은 중심 좌표를 기준으로 나눈 프로토타입용 참고
        범위입니다.
      </div>
      <BusanSeaMap />
    </main>
  );
}
