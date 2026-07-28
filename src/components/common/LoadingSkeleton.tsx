export function LoadingSkeleton() {
  return <div className="min-h-screen bg-slate-50 p-5" aria-label="불러오는 중"><div className="mx-auto max-w-6xl animate-pulse space-y-4"><div className="h-9 w-64 rounded bg-slate-200" /><div className="h-56 rounded-3xl bg-slate-200" /><div className="grid gap-4 md:grid-cols-3"><div className="h-44 rounded-3xl bg-slate-200" /><div className="h-44 rounded-3xl bg-slate-200" /><div className="h-44 rounded-3xl bg-slate-200" /></div></div></div>;
}
