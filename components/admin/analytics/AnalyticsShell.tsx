import Link from "next/link";
import type { ReactNode } from "react";
export default function AnalyticsShell({
  children,
  adminEmail,
}: {
  children: ReactNode;
  adminEmail: string;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div>
            <p className="text-xs tracking-widest text-neutral-400">
              PORTFOLIO ADMIN
            </p>
            <h1 className="mt-1 text-xl font-bold">방문 분석</h1>
          </div>
          <nav aria-label="관리자 메뉴" className="flex gap-4 text-sm">
            <Link href="/admin">콘텐츠 관리</Link>
            <Link href="/admin/blog">블로그 관리</Link>
            <Link href="/admin/analytics" aria-current="page">
              방문 분석
            </Link>
          </nav>
          <span className="max-w-60 truncate text-xs text-neutral-500">
            {adminEmail}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
