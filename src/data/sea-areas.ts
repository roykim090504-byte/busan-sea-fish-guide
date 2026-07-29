import type { SeaArea } from "@/types/marine";

export const SEA_AREAS: SeaArea[] = [
  { id: "gadeok", name: "가덕도 인근", latitude: 35.027, longitude: 128.86 },
  { id: "dadaepo", name: "다대포 앞바다", latitude: 35.035, longitude: 128.949 },
  { id: "songdo", name: "송도 앞바다", latitude: 35.068, longitude: 129.03 },
  { id: "taejongdae", name: "영도·태종대 인근", latitude: 35.052, longitude: 129.105 },
  { id: "oryukdo", name: "오륙도 인근", latitude: 35.089, longitude: 129.126 },
  { id: "gwangalli", name: "광안리 앞바다", latitude: 35.148, longitude: 129.125 },
  { id: "haeundae", name: "해운대 앞바다", latitude: 35.152, longitude: 129.171 },
  { id: "songjeong", name: "송정 앞바다", latitude: 35.19, longitude: 129.24 },
  { id: "gijang", name: "기장 앞바다", latitude: 35.238, longitude: 129.27 },
];

export const DEFAULT_AREA_ID = "gijang";
export const getSeaArea = (id: string) => SEA_AREAS.find((area) => area.id === id);
