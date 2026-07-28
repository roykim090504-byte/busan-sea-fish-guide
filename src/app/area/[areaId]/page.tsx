import { LiveAreaDetail } from "@/components/area/LiveAreaDetail";

export default async function AreaPage({ params }: { params: Promise<{ areaId: string }> }) {
  const { areaId } = await params;
  return <LiveAreaDetail areaId={areaId} />;
}
