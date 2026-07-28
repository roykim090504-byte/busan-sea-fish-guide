import { AlertTriangle, Info } from "lucide-react";

export function DataWarning({ children, tone = "warning" }: { children: React.ReactNode; tone?: "warning" | "info" }) {
  const Icon = tone === "warning" ? AlertTriangle : Info;
  return <div role="note" className={tone === "warning" ? "notice notice-warning" : "notice notice-info"}><Icon size={18} aria-hidden /><span>{children}</span></div>;
}
