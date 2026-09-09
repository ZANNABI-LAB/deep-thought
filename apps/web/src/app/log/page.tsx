import type { Metadata } from "next";
import Link from "next/link";
import { getAllLogs } from "@/lib/logs";

export const metadata: Metadata = {
  title: "Log",
  description: "학습과 제작 과정을 남기는 빌드 로그",
  alternates: { canonical: "/log" },
};

const LogList = () => {
  const logs = getAllLogs();
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Log</h1>
      <p className="mt-1.5 text-sm text-text-muted">학습과 제작 과정의 기록</p>
      <ul className="mt-9">
        {logs.map((l) => (
          <li key={l.slug} className="border-t border-line-soft">
            <Link href={`/log/${l.slug}`} className="flex gap-5 py-3.5 hover:text-accent">
              <span className="w-[86px] shrink-0 font-mono text-xs text-text-faint">
                {l.date.replaceAll("-", ".")}
              </span>
              <span className="text-[15px]">{l.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LogList;
