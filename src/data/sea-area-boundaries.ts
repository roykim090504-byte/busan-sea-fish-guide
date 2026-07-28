export type SeaAreaBoundary = {
  areaId: string;
  coordinates: Array<[latitude: number, longitude: number]>;
};

// 각 영역은 지도 기능을 시연하기 위해 해역 중심 좌표를 기준으로 나눈 참고 범위입니다.
// 실제 행정구역, 조업구역, 어업권 또는 항행 경계를 의미하지 않습니다.
export const SEA_AREA_BOUNDARIES: SeaAreaBoundary[] = [
  {
    areaId: "gadeok",
    coordinates: [
      [34.95, 128.75],
      [35.09, 128.75],
      [35.09, 128.91],
      [34.95, 128.91],
    ],
  },
  {
    areaId: "dadaepo",
    coordinates: [
      [34.96, 128.91],
      [35.095, 128.91],
      [35.095, 128.985],
      [34.96, 128.985],
    ],
  },
  {
    areaId: "songdo",
    coordinates: [
      [35.0, 128.985],
      [35.105, 128.985],
      [35.105, 129.045],
      [35.0, 129.045],
    ],
  },
  {
    areaId: "taejongdae",
    coordinates: [
      [34.98, 129.045],
      [35.105, 129.045],
      [35.105, 129.115],
      [34.98, 129.115],
    ],
  },
  {
    areaId: "oryukdo",
    coordinates: [
      [35.035, 129.115],
      [35.125, 129.115],
      [35.125, 129.15],
      [35.035, 129.15],
    ],
  },
  {
    areaId: "gwangalli",
    coordinates: [
      [35.125, 129.105],
      [35.172, 129.105],
      [35.172, 129.15],
      [35.125, 129.15],
    ],
  },
  {
    areaId: "haeundae",
    coordinates: [
      [35.125, 129.15],
      [35.195, 129.15],
      [35.195, 129.195],
      [35.125, 129.195],
    ],
  },
  {
    areaId: "songjeong",
    coordinates: [
      [35.145, 129.195],
      [35.22, 129.195],
      [35.22, 129.23],
      [35.145, 129.23],
    ],
  },
  {
    areaId: "gijang",
    coordinates: [
      [35.2, 129.23],
      [35.33, 129.23],
      [35.33, 129.33],
      [35.2, 129.33],
    ],
  },
];
