import type { MarineObservation } from "@/types/marine";

// 이 데이터는 화면과 계산 기능을 시연하기 위한 예시 데이터입니다.
// 실제 부산 해양 관측값이 아닙니다.
export const MARINE_OBSERVATIONS: MarineObservation[] = [
  { areaId: "gadeok", areaName: "가덕도 인근", latitude: 35.027, longitude: 128.829, observedAt: "2026-07-28T09:10:00+09:00", waterTemperature: 23.7, airTemperature: 28.4, windSpeed: 4.2, windDirection: "남서", waveHeight: 0.7, currentSpeed: 0.48, weather: "구름 조금" },
  { areaId: "dadaepo", areaName: "다대포 앞바다", latitude: 35.035, longitude: 128.949, observedAt: "2026-07-28T09:00:00+09:00", waterTemperature: 24.5, airTemperature: 29.1, windSpeed: 11.8, windDirection: "남", waveHeight: 1.4, currentSpeed: 0.62, weather: "흐림" },
  { areaId: "songdo", areaName: "송도 앞바다", latitude: 35.068, longitude: 129.018, observedAt: "2026-07-28T08:50:00+09:00", waterTemperature: null, airTemperature: 28.8, windSpeed: 3.5, windDirection: "남동", waveHeight: 0.5, currentSpeed: 0.31, weather: "맑음" },
  { areaId: "taejongdae", areaName: "영도·태종대 인근", latitude: 35.052, longitude: 129.088, observedAt: "2026-07-28T09:20:00+09:00", waterTemperature: 22.8, airTemperature: 27.6, windSpeed: 5.6, windDirection: "동", waveHeight: 2.3, currentSpeed: 0.82, weather: "흐리고 바람" },
  { areaId: "oryukdo", areaName: "오륙도 인근", latitude: 35.089, longitude: 129.126, observedAt: "2026-07-28T09:15:00+09:00", waterTemperature: 23.2, airTemperature: 27.9, windSpeed: 6.1, windDirection: "남동", waveHeight: 1.1, currentSpeed: null, weather: "구름 많음" },
  { areaId: "gwangalli", areaName: "광안리 앞바다", latitude: 35.148, longitude: 129.125, observedAt: "2026-07-28T08:45:00+09:00", waterTemperature: 25.1, airTemperature: 29.6, windSpeed: 2.4, windDirection: "남", waveHeight: 0.3, currentSpeed: 0.18, weather: "맑음" },
  { areaId: "haeundae", areaName: "해운대 앞바다", latitude: 35.152, longitude: 129.171, observedAt: "2026-07-22T11:00:00+09:00", waterTemperature: 24.1, airTemperature: 28.2, windSpeed: 4.8, windDirection: "동남동", waveHeight: 0.8, currentSpeed: 0.41, weather: "구름 조금" },
  { areaId: "songjeong", areaName: "송정 앞바다", latitude: 35.177, longitude: 129.207, observedAt: "2026-07-28T09:05:00+09:00", waterTemperature: null, airTemperature: null, windSpeed: null, windDirection: null, waveHeight: 0.6, currentSpeed: null, weather: null },
  { areaId: "gijang", areaName: "기장 앞바다", latitude: 35.238, longitude: 129.245, observedAt: "2026-07-28T09:25:00+09:00", waterTemperature: 22.4, airTemperature: 27.3, windSpeed: 3.8, windDirection: "남동", waveHeight: 0.6, currentSpeed: 0.55, weather: "맑음" },
];

export const getObservation = (areaId: string) =>
  MARINE_OBSERVATIONS.find((observation) => observation.areaId === areaId);
