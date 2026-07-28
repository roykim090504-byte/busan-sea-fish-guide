"use client";

import { useEffect, useState } from "react";
import { MARINE_OBSERVATIONS } from "@/data/marine-observations";
import { normalizeMarineApiResponseTimes } from "@/lib/time/normalize-marine-time";
import type { MarineApiResponse } from "@/types/marine";

const initial = normalizeMarineApiResponseTimes({
  observations: MARINE_OBSERVATIONS.map((item) => ({ ...item, source: "sample" })),
  source: "sample",
  fetchedAt: new Date().toISOString(),
  warnings: [],
} satisfies MarineApiResponse);

export function useMarineObservations() {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/marine", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<MarineApiResponse> : Promise.reject())
      .then((response) => setData(normalizeMarineApiResponseTimes(response)))
      .catch(() => setData({ ...initial, warnings: ["실시간 데이터를 불러오지 못해 예시 데이터를 표시합니다."] }))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  return { ...data, loading };
}
