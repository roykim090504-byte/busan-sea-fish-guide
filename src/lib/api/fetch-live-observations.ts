import { MARINE_OBSERVATIONS } from "@/data/marine-observations";
import { BUSAN_OBSERVATION_STATIONS } from "@/data/observation-stations";
import { SEA_AREAS } from "@/data/sea-areas";
import { normalizeMarineApiResponseTimes } from "@/lib/time/normalize-marine-time";
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
type KmaForecastItem = { category: string; fcstDate: string; fcstTime: string; fcstValue: string };
type KmaSeaObservation = {
  latitude: number;
  longitude: number;
  observedAt: string;
  stationName: string;
  waveHeight: number;
};
const KHOA_URL = "https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService";
const KMA_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
const KMA_FORECAST_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";
const KMA_SEA_OBSERVATION_URL = "https://apihub.kma.go.kr/api/typ01/url/sea_obs.php";

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

const skyLabel = (sky: string | undefined) => ({
  "1": "맑음",
  "3": "구름 많음",
  "4": "흐림",
}[sky ?? ""]);

const detailedWeatherLabel = (pty: string | undefined, sky: string | undefined) => {
  if (!pty || pty === "0") return skyLabel(sky) ?? weatherLabel(pty);
  const precipitation = weatherLabel(pty);
  const skyCondition = skyLabel(sky);
  return skyCondition && skyCondition !== "맑음" ? `${skyCondition} ${precipitation}` : precipitation;
};

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
  const forecastBase = kstForecastParts();
  const forecastUrl = new URL(KMA_FORECAST_URL);
  forecastUrl.search = new URLSearchParams({
    serviceKey: key, pageNo: "1", numOfRows: "300", dataType: "JSON",
    base_date: forecastBase.date, base_time: forecastBase.time, nx: String(nx), ny: String(ny),
  }).toString();
  const [response, forecastResponse] = await Promise.all([
    fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } }),
    fetch(forecastUrl, { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } }),
  ]);
  if (!response.ok) return null;
  const json = await response.json() as { response?: { body?: { items?: { item?: KmaItem[] } } } };
  const values = Object.fromEntries((json.response?.body?.items?.item ?? []).map((item) => [item.category, item.obsrValue]));
  const forecastJson = forecastResponse.ok
    ? await forecastResponse.json() as { response?: { body?: { items?: { item?: KmaForecastItem[] } } } }
    : undefined;
  const forecastItems = forecastJson?.response?.body?.items?.item ?? [];
  const nextForecastTime = [...new Set(forecastItems.map((item) => `${item.fcstDate}${item.fcstTime}`))].sort()[0];
  const forecastValues = Object.fromEntries(forecastItems
    .filter((item) => `${item.fcstDate}${item.fcstTime}` === nextForecastTime)
    .map((item) => [item.category, item.fcstValue]));
  return {
    airTemperature: numberOrNull(values.T1H),
    windSpeed: numberOrNull(values.WSD),
    windDirection: directionLabel(numberOrNull(values.VEC)),
    weather: detailedWeatherLabel(values.PTY, forecastValues.SKY),
  };
}

const kmaSeaObservationTime = (date = new Date()) => {
  const shifted = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, "0")}${String(shifted.getUTCDate()).padStart(2, "0")}${String(shifted.getUTCHours()).padStart(2, "0")}00`;
};

const kstForecastParts = (date = new Date()) => {
  const shifted = new Date(date.getTime() + 9 * 60 * 60 * 1000 - 45 * 60 * 1000);
  return {
    date: `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, "0")}${String(shifted.getUTCDate()).padStart(2, "0")}`,
    time: `${String(shifted.getUTCHours()).padStart(2, "0")}30`,
  };
};

const parseKmaSeaObservations = (text: string): KmaSeaObservation[] => text
  .split(",=")
  .map((record) => record.trim().replace(/\s+/g, " "))
  .filter((record) => /^[A-Z],/.test(record))
  .map((record) => record.split(",").map((value) => value.trim()))
  .map(([type, observedAt, , stationName, longitude, latitude, waveHeight]) => ({
    type,
    observedAt,
    stationName,
    longitude: numberOrNull(longitude),
    latitude: numberOrNull(latitude),
    waveHeight: numberOrNull(waveHeight),
  }))
  .filter((item): item is KmaSeaObservation & { type: string } => (
    item.type !== "" && item.observedAt !== "" && item.stationName !== "" &&
    item.longitude !== null && item.latitude !== null && item.waveHeight !== null && item.waveHeight >= 0
  ))
  .map(({ type: _type, ...item }) => item);

async function fetchKmaSeaObservations(key: string): Promise<KmaSeaObservation[]> {
  const url = new URL(KMA_SEA_OBSERVATION_URL);
  url.search = new URLSearchParams({ tm: kmaSeaObservationTime(), stn: "0", authKey: key }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } });
  if (!response.ok) return [];
  const text = new TextDecoder("euc-kr").decode(await response.arrayBuffer());
  return parseKmaSeaObservations(text);
}

const distance = (a: { latitude: number; longitude: number }, b: { lat: number; lot: number }) =>
  Math.hypot(a.latitude - b.lat, (a.longitude - b.lot) * Math.cos(a.latitude * Math.PI / 180));

const kmaSeaObservationDistance = (area: { latitude: number; longitude: number }, observation: KmaSeaObservation) =>
  Math.hypot(area.latitude - observation.latitude, (area.longitude - observation.longitude) * Math.cos(area.latitude * Math.PI / 180));

const firstBuoyWithValue = (
  buoys: BuoyItem[],
  value: (buoy: BuoyItem) => number | null,
) => buoys.find((buoy) => value(buoy) !== null) ?? null;

const fallbackResponse = (warning: string): MarineApiResponse => normalizeMarineApiResponseTimes({
  observations: MARINE_OBSERVATIONS.map((item) => ({ ...item, source: "sample" as const })),
  source: "sample",
  fetchedAt: new Date().toISOString(),
  warnings: [warning],
});

export async function fetchLiveObservations(): Promise<MarineApiResponse> {
  const khoaKey = process.env.KHOA_API_KEY;
  const kmaKey = process.env.KMA_API_KEY;
  const kmaSeaObservationKey = process.env.KMA_SEA_OBS_API_KEY;
  if (!khoaKey || !kmaKey) return fallbackResponse("API 키가 설정되지 않아 예시 데이터를 표시합니다.");
  try {
    const buoyResults = (await Promise.all(BUSAN_OBSERVATION_STATIONS.map((station) =>
      fetchBuoy(station.code, khoaKey).catch(() => null),
    ))).filter((item): item is BuoyItem => item !== null);
    if (!buoyResults.length) return fallbackResponse("해양 관측 API에서 데이터를 받지 못해 예시 데이터를 표시합니다.");
    const kmaSeaObservations = kmaSeaObservationKey
      ? await fetchKmaSeaObservations(kmaSeaObservationKey).catch(() => [])
      : [];
    const observations: MarineObservation[] = await Promise.all(SEA_AREAS.map(async (area) => {
      const nearbyBuoys = [...buoyResults].sort((a, b) => distance(area, a) - distance(area, b));
      const buoy = nearbyBuoys[0];
      const waterTemperatureBuoy = firstBuoyWithValue(nearbyBuoys, (item) => numberOrNull(item.wtem));
      const waveHeightBuoy = firstBuoyWithValue(nearbyBuoys, (item) => numberOrNull(item.wvhgt));
      const kmaWaveObservation = [...kmaSeaObservations]
        .sort((a, b) => kmaSeaObservationDistance(area, a) - kmaSeaObservationDistance(area, b))[0] ?? null;
      const shouldUseKmaWave = kmaWaveObservation !== null && (
        waveHeightBuoy === null || kmaSeaObservationDistance(area, kmaWaveObservation) < distance(area, waveHeightBuoy)
      );
      const currentSpeedBuoy = firstBuoyWithValue(nearbyBuoys, (item) => {
        const centimetersPerSecond = numberOrNull(item.crsp);
        return centimetersPerSecond === null ? null : centimetersPerSecond / 100;
      });
      const weather = await fetchWeather(area.latitude, area.longitude, kmaKey).catch(() => null);
      const currentSpeedCentimetersPerSecond = currentSpeedBuoy
        ? numberOrNull(currentSpeedBuoy.crsp)
        : null;
      const supplementedMetrics = [
        waterTemperatureBuoy && waterTemperatureBuoy !== buoy ? "수온" : null,
        waveHeightBuoy && waveHeightBuoy !== buoy ? "파고" : null,
        currentSpeedBuoy && currentSpeedBuoy !== buoy ? "조류" : null,
      ].filter((metric): metric is string => metric !== null);
      return {
        areaId: area.id, areaName: area.name, latitude: area.latitude, longitude: area.longitude,
        observedAt: `${buoy.obsrvnDt.replace(" ", "T")}:00+09:00`,
        waterTemperature: waterTemperatureBuoy ? numberOrNull(waterTemperatureBuoy.wtem) : null,
        airTemperature: weather?.airTemperature ?? numberOrNull(buoy.artmp),
        windSpeed: weather?.windSpeed ?? numberOrNull(buoy.wspd),
        windDirection: weather?.windDirection ?? directionLabel(numberOrNull(buoy.wndrct)),
        waveHeight: shouldUseKmaWave ? kmaWaveObservation.waveHeight : (waveHeightBuoy ? numberOrNull(waveHeightBuoy.wvhgt) : null),
        currentSpeed: currentSpeedCentimetersPerSecond === null ? null : currentSpeedCentimetersPerSecond / 100,
        weather: weather?.weather ?? null,
        source: "live", stationName: buoy.obsvtrNm, supplementedMetrics,
      };
    }));
    const warnings = observations.some((item) => [item.waterTemperature, item.windSpeed, item.waveHeight, item.currentSpeed].some((value) => value === null))
      ? ["일부 관측소에서 제공하지 않는 항목은 데이터 없음으로 표시합니다."] : [];
    if (observations.some((item) => item.supplementedMetrics?.length)) {
      warnings.push("일부 수온·파고·조류 값은 인근 관측소의 최신 관측값으로 보완했습니다.");
    }
    if (kmaSeaObservations.length) {
      warnings.push("파고는 기상청 해상 관측과 국립해양조사원 관측 중 더 가까운 최신 관측소 값을 사용합니다.");
    }
    return normalizeMarineApiResponseTimes({
      observations,
      source: "live",
      fetchedAt: new Date().toISOString(),
      warnings,
    });
  } catch {
    return fallbackResponse("실시간 API 연결에 실패해 예시 데이터를 표시합니다.");
  }
}
