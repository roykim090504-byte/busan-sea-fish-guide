import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의 부산 앞바다",
  description: "국립해양조사원과 기상청 최신 관측 데이터를 바탕으로 부산 해역의 어종별 환경 적합도를 보여 주는 서비스",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
