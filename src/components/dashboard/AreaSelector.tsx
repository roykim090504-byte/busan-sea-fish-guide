import { SEA_AREAS } from "@/data/sea-areas";

export function AreaSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">해역 선택</span><select className="select-field" value={value} onChange={(event) => onChange(event.target.value)}>{SEA_AREAS.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}</select></label>;
}
