"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Fish } from "lucide-react";
import { ConfidenceBadge } from "@/components/common/ConfidenceBadge";
import { ScoreBadge } from "@/components/common/ScoreBadge";
import type { FishPrediction } from "@/types/prediction";

type Sort = "score-desc" | "score-asc" | "confidence" | "name";
type Filter = "all" | "very-high" | "high-plus";
const confidenceOrder = { high: 3, medium: 2, low: 1 };

export function FishRanking({ predictions }: { predictions: FishPrediction[] }) {
  const [sort, setSort] = useState<Sort>("score-desc");
  const [filter, setFilter] = useState<Filter>("all");
  const visible = useMemo(() => {
    const filtered = predictions.filter((item) => filter === "all" || (filter === "very-high" ? item.level === "very-high" : ["very-high", "high"].includes(item.level)));
    return [...filtered].sort((a, b) => sort === "score-asc" ? a.suitabilityScore - b.suitabilityScore : sort === "confidence" ? confidenceOrder[b.confidence] - confidenceOrder[a.confidence] : sort === "name" ? a.fishName.localeCompare(b.fishName, "ko") : b.suitabilityScore - a.suitabilityScore);
  }, [predictions, sort, filter]);
  return <section aria-labelledby="ranking-title"><div className="ranking-controls"><label><span>정렬</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="score-desc">적합도 높은 순</option><option value="score-asc">적합도 낮은 순</option><option value="confidence">신뢰도 높은 순</option><option value="name">어종 이름순</option></select></label><label><span>필터</span><select value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="all">전체 보기</option><option value="very-high">매우 높음만</option><option value="high-plus">높음 이상</option></select></label></div><h2 id="ranking-title" className="sr-only">전체 어종 순위</h2><div className="ranking-list">{visible.map((item, index) => <article className="ranking-row" key={item.fishId}><span className="ranking-number">{index + 1}</span><div className="fish-icon"><Fish size={20} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3>{item.fishName}</h3><ScoreBadge level={item.level} /></div><p>{item.reasons[0]}</p></div><div className="ranking-score"><strong>{item.suitabilityScore}</strong><span>점</span><ConfidenceBadge confidence={item.confidence} /></div></article>)}</div>{visible.length === 0 && <div className="empty-card"><ArrowUpDown /><p>선택한 조건에 맞는 어종이 없습니다.</p></div>}</section>;
}
