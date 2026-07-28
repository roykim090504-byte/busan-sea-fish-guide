export type ObservationStation = {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
};

// 국립해양조사원 해양관측부이 운영 현황 및 최신 관측 API의 부산권 관측소 코드입니다.
export const BUSAN_OBSERVATION_STATIONS: ObservationStation[] = [
  { code: "TW_0062", name: "해운대해수욕장", latitude: 35.14897, longitude: 129.17016 },
  { code: "TW_0086", name: "부산항신항", latitude: 35.04377, longitude: 128.76175 },
  { code: "TW_0087", name: "부산항", latitude: 35.09175, longitude: 129.08525 },
  { code: "TW_0088", name: "감천항", latitude: 35.0528, longitude: 129.00308 },
  { code: "TW_0090", name: "송정해수욕장", latitude: 35.16472, longitude: 129.21944 },
  { code: "TW_0092", name: "임랑해수욕장", latitude: 35.3025, longitude: 129.2925 },
];
