import { MARINE_OBSERVATIONS } from "@/data/marine-observations";
import { BUSAN_OBSERVATION_STATIONS } from "@/data/observation-stations";
import { SEA_AREAS } from "@/data/sea-areas";
import { normalizeMarineApiResponseTimes } from "@/lib/time/normalize-marine-time";
import type { MarineApiResponse, MarineHistoryPoint, MarineObservation } from "@/types/marine";
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
  windSpeed: number | null;
  waterTemperature: number | null;
};
const KHOA_URL = "https://apis.data.go.kr/1192136/twRecent/GetTWRecentApiService";
const KMA_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
const KMA_FORECAST_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";
const KMA_SEA_OBSERVATION_URL = "https://apihub.kma.go.kr/api/typ01/url/sea_obs.php";

const numberOrNull = (value: unknown) => {
  const number = Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(number) || number === -99 ? null : number;
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

const khoaObservationDate = (date: Date) => {
  const shifted = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, "0")}${String(shifted.getUTCDate()).padStart(2, "0")}`;
};

async function fetchBuoyHistory(code: string, key: string, observedDate: string): Promise<BuoyItem[]> {
  const url = new URL(KHOA_URL);
  url.search = new URLSearchParams({
    serviceKey: key,
    type: "json",
    obsCode: code,
    obsDate: observedDate,
    interval: "120",
    numOfRows: "200",
  }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } });
  if (!response.ok) return [];
  const json = await response.json() as { body?: { items?: { item?: BuoyItem[] } } };
  return json.body?.items?.item ?? [];
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
  .map(([type, observedAt, , stationName, longitude, latitude, waveHeight, , windSpeed, , waterTemperature]) => ({
    type,
    observedAt,
    stationName,
    longitude: numberOrNull(longitude),
    latitude: numberOrNull(latitude),
    waveHeight: numberOrNull(waveHeight),
    windSpeed: numberOrNull(windSpeed),
    waterTemperature: numberOrNull(waterTemperature),
  }))
  .filter((item): item is KmaSeaObservation & { type: string } => (
    item.type !== "" && item.observedAt !== "" && item.stationName !== "" &&
    item.longitude !== null && item.latitude !== null && item.waveHeight !== null && item.waveHeight >= 0
  ))
  .map(({ type: _type, ...item }) => item);

async function fetchKmaSeaObservations(key: string, date = new Date()): Promise<KmaSeaObservation[]> {
  const url = new URL(KMA_SEA_OBSERVATION_URL);
  url.search = new URLSearchParams({ tm: kmaSeaObservationTime(date), stn: "0", authKey: key }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } });
  if (!response.ok) return [];
  const text = new TextDecoder("euc-kr").decode(await response.arrayBuffer());
  return parseKmaSeaObservations(text);
}

const kmaObservedAtToIso = (value: string) => {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) return new Date().toISOString();
  const [, year, month, day, hour, minute] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 9, Number(minute))).toISOString();
};

async function fetchKmaSeaHistory(key: string): Promise<Record<string, MarineHistoryPoint[]>> {
  const latest = new Date();
  latest.setMinutes(0, 0, 0);
  const requestTimes = Array.from({ length: 13 }, (_, index) => new Date(latest.getTime() - (12 - index) * 2 * 60 * 60 * 1000));
  const snapshots: { time: Date; observations: KmaSeaObservation[] }[] = [];
  for (let start = 0; start < requestTimes.length; start += 3) {
    const batch = await Promise.all(requestTimes.slice(start, start + 3).map(async (time) => ({
      time,
      observations: await fetchKmaSeaObservations(key, time).catch(() => []),
    })));
    snapshots.push(...batch);
  }

  return Object.fromEntries(SEA_AREAS.map((area) => [area.id, snapshots.map(({ time, observations }) => {
    const nearby = [...observations]
      .sort((a, b) => kmaSeaObservationDistance(area, a) - kmaSeaObservationDistance(area, b));
    const nearest = nearby[0] ?? null;
    const windObservation = nearby.find((item) => item.windSpeed !== null) ?? null;
    const waterTemperatureObservation = nearby.find((item) => item.waterTemperature !== null) ?? null;
    return {
      observedAt: nearest ? kmaObservedAtToIso(nearest.observedAt) : time.toISOString(),
      waterTemperature: waterTemperatureObservation?.waterTemperature ?? null,
      windSpeed: windObservation?.windSpeed ?? null,
      waveHeight: nearest?.waveHeight ?? null,
      currentSpeed: null,
    };
  })]));
}

const distance = (a: { latitude: number; longitude: number }, b: { lat: number; lot: number }) =>
  Math.hypot(a.latitude - b.lat, (a.longitude - b.lot) * Math.cos(a.latitude * Math.PI / 180));

const kmaSeaObservationDistance = (area: { latitude: number; longitude: number }, observation: KmaSeaObservation) =>
  Math.hypot(area.latitude - observation.latitude, (area.longitude - observation.longitude) * Math.cos(area.latitude * Math.PI / 180));

const parseBuoyObservedAt = (value: string) => Date.parse(`${value.replace(" ", "T")}:00+09:00`);

async function fetchKhoaCurrentHistory(key: string): Promise<Record<string, (number | null)[]>> {
  const latest = new Date();
  latest.setMinutes(0, 0, 0);
  const targetTimes = Array.from({ length: 13 }, (_, index) => new Date(latest.getTime() - (12 - index) * 2 * 60 * 60 * 1000));
  const dates = [...new Set(targetTimes.map(khoaObservationDate))];
  const stationRecords = await Promise.all(BUSAN_OBSERVATION_STATIONS.map(async (station) => ({
    station,
    records: (await Promise.all(dates.map((date) => fetchBuoyHistory(station.code, key, date).catch(() => [])))).flat(),
  })));

  return Object.fromEntries(SEA_AREAS.map((area) => [area.id, targetTimes.map((targetTime) => {
    const candidates = stationRecords.flatMap(({ station, records }) => records.map((record) => ({ station, record })));
    const matching = candidates
      .map(({ station, record }) => ({
        distance: distance(area, { lat: numberOrNull(record.lat) ?? station.latitude, lot: numberOrNull(record.lot) ?? station.longitude }),
        timeDifference: Math.abs(parseBuoyObservedAt(record.obsrvnDt) - targetTime.getTime()),
        currentSpeed: numberOrNull(record.crsp),
      }))
      .filter((item) => item.currentSpeed !== null && Number.isFinite(item.timeDifference) && item.timeDifference <= 90 * 60 * 1000)
      .sort((a, b) => a.distance - b.distance || a.timeDifference - b.timeDifference);
    const value = matching[0]?.currentSpeed ?? null;
    return value === null ? null : value / 100;
  })]));
}

const firstBuoyWithValue = (
  buoys: BuoyItem[],
  value: (buoy: BuoyItem) => number | null,
) => buoys.find((buoy) => value(buoy) !== null) ?? null;

const fallbackResponse = (warning: string): MarineApiResponse => normalizeMarineApiResponseTimes({
  observations: MARINE_OBSERVATIONS.map((item) => ({ ...item, source: "sample" as const })),
  history: {},
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
    const [kmaSeaObservations, kmaHistory, khoaCurrentHistory] = await Promise.all([
      kmaSeaObservationKey ? fetchKmaSeaObservations(kmaSeaObservationKey).catch(() => []) : Promise.resolve([]),
      kmaSeaObservationKey
        ? fetchKmaSeaHistory(kmaSeaObservationKey).catch((): Record<string, MarineHistoryPoint[]> => ({}))
        : Promise.resolve<Record<string, MarineHistoryPoint[]>>({}),
      fetchKhoaCurrentHistory(khoaKey).catch((): Record<string, (number | null)[]> => ({})),
    ]);
    const history = Object.fromEntries(Object.entries(kmaHistory).map(([areaId, points]) => [
      areaId,
      points.map((point, index) => ({
        ...point,
        currentSpeed: khoaCurrentHistory[areaId]?.[index] ?? null,
      })),
    ]));
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
    return normalizeMarineApiResponseTimes({
      observations,
      history,
      source: "live",
      fetchedAt: new Date().toISOString(),
      warnings,
    });
  } catch {
    return fallbackResponse("실시간 API 연결에 실패해 예시 데이터를 표시합니다.");
  }
}
