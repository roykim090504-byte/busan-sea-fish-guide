import { MARINE_OBSERVATIONS } from "@/data/marine-observations";
import { BUSAN_OBSERVATION_STATIONS } from "@/data/observation-stations";
import { SEA_AREAS } from "@/data/sea-areas";
import type { MarineApiResponse, MarineObservation } from "@/types/marine";
import { toKmaGrid } from "./kma-grid";

type BuoyItem = {
  obsvtrNm: string;
  lot: number;
  lat: number;
  obsrvnDt: string;
  wndrct: number | null;
  wspd: number | null;
  artmp: number | null;
  wvhgt: number | null;
  crsp: number | null;
  wtem: number | null;
};

type KmaItem = { category: string; obsrValue: string };
const KHOA_URL = "https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService";
const KMA_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";

const numberOrNull = (value: unknown) => {
  const number = Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(number) ? null : number;
};

const directionLabel = (degrees: number | null) => {
  if (degrees === null) return null;
  const labels = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return labels[Math.round(degrees / 45) % 8];
};

const weatherLabel = (pty: string | undefined) => ({
  "0": "강수 없음", "1": "비", "2": "비·눈", "3": "눈", "5": "빗방울", "6": "빗방울·눈날림", "7": "눈날림",
}[pty ?? ""] ?? "상태 미상");

const kstParts = (date = new Date()) => {
  const shifted = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  shifted.setUTCHours(shifted.getUTCHours() - 1);
  return {
    date: `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, "0")}${String(shifted.getUTCDate()).padStart(2, "0")}`,
    time: `${String(shifted.getUTCHours()).padStart(2, "0")}00`,
  };
};

async function fetchBuoy(code: string, key: string): Promise<BuoyItem | null> {
  const url = new URL(KHOA_URL);
  url.search = new URLSearchParams({ serviceKey: key, type: "json", obsCode: code, numOfRows: "1" }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } });
  if (!response.ok) return null;
  const json = await response.json() as { body?: { items?: { item?: BuoyItem[] } } };
  return json.body?.items?.item?.[0] ?? null;
}

async function fetchWeather(latitude: number, longitude: number, key: string) {
  const { nx, ny } = toKmaGrid(latitude, longitude);
  const base = kstParts();
  const url = new URL(KMA_URL);
  url.search = new URLSearchParams({
    serviceKey: key, pageNo: "1", numOfRows: "100", dataType: "JSON",
    base_date: base.date, base_time: base.time, nx: String(nx), ny: String(ny),
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } });
  if (!response.ok) return null;
  const json = await response.json() as { response?: { body?: { items?: { item?: KmaItem[] } } } };
  const values = Object.fromEntries((json.response?.body?.items?.item ?? []).map((item) => [item.category, item.obsrValue]));
  return {
    airTemperature: numberOrNull(values.T1H),
    windSpeed: numberOrNull(values.WSD),
    windDirection: directionLabel(numberOrNull(values.VEC)),
    weather: weatherLabel(values.PTY),
  };
}

const distance = (a: { latitude: number; longitude: number }, b: { lat: number; lot: number }) =>
  Math.hypot(a.latitude - b.lat, (a.longitude - b.lot) * Math.cos(a.latitude * Math.PI / 180));

const fallbackResponse = (warning: string): MarineApiResponse => ({
  observations: MARINE_OBSERVATIONS.map((item) => ({ ...item, source: "sample" as const })),
  source: "sample",
  fetchedAt: new Date().toISOString(),
  warnings: [warning],
});

export async function fetchLiveObservations(): Promise<MarineApiResponse> {
  const khoaKey = process.env.KHOA_API_KEY;
  const kmaKey = process.env.KMA_API_KEY;
  if (!khoaKey || !kmaKey) return fallbackResponse("API 키가 설정되지 않아 예시 데이터를 표시합니다.");
  try {
    const buoyResults = (await Promise.all(BUSAN_OBSERVATION_STATIONS.map((station) =>
      fetchBuoy(station.code, khoaKey).catch(() => null),
    ))).filter((item): item is BuoyItem => item !== null);
    if (!buoyResults.length) return fallbackResponse("해양 관측 API에서 데이터를 받지 못해 예시 데이터를 표시합니다.");
    const observations: MarineObservation[] = await Promise.all(SEA_AREAS.map(async (area) => {
      const buoy = [...buoyResults].sort((a, b) => distance(area, a) - distance(area, b))[0];
      const weather = await fetchWeather(area.latitude, area.longitude, kmaKey).catch(() => null);
      return {
        areaId: area.id, areaName: area.name, latitude: area.latitude, longitude: area.longitude,
        observedAt: `${buoy.obsrvnDt.replace(" ", "T")}:00+09:00`,
        waterTemperature: numberOrNull(buoy.wtem),
        airTemperature: weather?.airTemperature ?? numberOrNull(buoy.artmp),
        windSpeed: weather?.windSpeed ?? numberOrNull(buoy.wspd),
        windDirection: weather?.windDirection ?? directionLabel(numberOrNull(buoy.wndrct)),
        waveHeight: numberOrNull(buoy.wvhgt),
        currentSpeed: buoy.crsp === null ? null : numberOrNull(buoy.crsp / 100),
        weather: weather?.weather ?? null,
        source: "live", stationName: buoy.obsvtrNm,
      };
    }));
    return {
      observations,
      source: "live",
      fetchedAt: new Date().toISOString(),
      warnings: observations.some((item) => [item.waterTemperature, item.windSpeed, item.waveHeight, item.currentSpeed].some((value) => value === null))
        ? ["일부 관측소에서 제공하지 않는 항목은 데이터 없음으로 표시합니다."] : [],
    };
  } catch {
    return fallbackResponse("실시간 API 연결에 실패해 예시 데이터를 표시합니다.");
  }
}
