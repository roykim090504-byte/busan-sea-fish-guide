import { fetchLiveObservations } from "@/lib/api/fetch-live-observations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const data = await fetchLiveObservations();
  return Response.json(data, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
  });
}
