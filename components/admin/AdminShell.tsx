'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, BookOpen } from 'lucide-react';
import { ReactNode } from 'react';
import { SectionKey, sectionKeys } from '@/lib/types/payload';
import { createClient } from '@/utils/supabase/client';
import { Button } from './ui/Button';

interface SectionMeta {
  label: string;
  description: string;
  group: 'content' | 'auto';
}

export const sectionMeta: Record<SectionKey, SectionMeta> = {
  site: { label: '사이트', description: '기본 정보 · 히어로 · 푸터', group: 'content' },
  about: { label: 'About', description: '프로필 기본 정보', group: 'content' },
  skills: { label: '스킬', description: '기술 카테고리', group: 'content' },
  archiving: { label: '아카이빙', description: '외부 콘텐츠 링크', group: 'content' },
  career: { label: '경력', description: '회사 이력', group: 'content' },
  projects: { label: '프로젝트', description: '포트폴리오 상세', group: 'content' },
  'project-portfolio-sync': {
    label: 'Portfolio Sync',
    description: '자동 수집 · 읽기 전용',
    group: 'auto',
  },
  'activity-heatmap': {
    label: 'Activity Heatmap',
    description: '자동 수집 · 읽기 전용',
    group: 'auto',
  },
};

interface AdminShellProps {
  currentSection: SectionKey;
  onSelectSection: (key: SectionKey) => void;
  adminEmail: string;
  children: ReactNode;
}

export function AdminShell({
  currentSection,
  onSelectSection,
  adminEmail,
  children,
}: AdminShellProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  };

  const contentSections = sectionKeys.filter((k) => sectionMeta[k].group === 'content');
  const autoSections = sectionKeys.filter((k) => sectionMeta[k].group === 'auto');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-shrink-0 border-r border-neutral-200 bg-white md:flex md:flex-col">
          <div className="border-b border-neutral-200 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Portfolio
            </p>
            <h1 className="mt-0.5 text-base font-bold text-neutral-900">Admin</h1>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarGroup title="콘텐츠">
              {contentSections.map((key) => (
                <SidebarItem
                  key={key}
                  label={sectionMeta[key].label}
                  description={sectionMeta[key].description}
                  active={currentSection === key}
                  onClick={() => onSelectSection(key)}
                />
              ))}
            </SidebarGroup>
            <SidebarGroup title="자동 수집">
              {autoSections.map((key) => (
                <SidebarItem
                  key={key}
                  label={sectionMeta[key].label}
                  description={sectionMeta[key].description}
                  active={currentSection === key}
                  onClick={() => onSelectSection(key)}
                />
              ))}
            </SidebarGroup>
            <SidebarGroup title="블로그">
              <li>
                <Link
                  href="/admin/blog"
                  className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-neutral-700 transition-colors hover:bg-neutral-100"
                >
                  <BookOpen className="h-4 w-4" />
                  <div>
                    <span className="block text-sm font-medium">글 관리</span>
                    <span className="mt-0.5 block text-[11px] text-neutral-500">
                      포스트 · 댓글
                    </span>
                  </div>
                </Link>
              </li>
            </SidebarGroup>
          </nav>

          <div className="border-t border-neutral-200 px-4 py-3">
            <p className="text-[11px] text-neutral-500">로그인 중</p>
            <p className="truncate text-xs font-medium text-neutral-800">{adminEmail}</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-center"
              onClick={handleLogout}
              iconLeft={<LogOut className="h-3.5 w-3.5" />}
            >
              로그아웃
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-3 md:hidden">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Portfolio
              </p>
              <h1 className="text-sm font-bold">Admin</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              iconLeft={<LogOut className="h-3.5 w-3.5" />}
            >
              로그아웃
            </Button>
          </header>

          <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 md:hidden">
            {sectionKeys.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onSelectSection(key)}
                className={`flex-shrink-0 cursor-pointer rounded-full border px-3 py-1 text-xs transition ${
                  currentSection === key
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
                }`}
              >
                {sectionMeta[key].label}
              </button>
            ))}
          </div>

          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function SidebarItem({
  label,
  description,
  active,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full cursor-pointer rounded-md px-2.5 py-2 text-left transition-colors ${
          active
            ? 'bg-neutral-900 text-white'
            : 'text-neutral-700 hover:bg-neutral-100'
        }`}
      >
        <span className="block text-sm font-medium">{label}</span>
        <span
          className={`mt-0.5 block truncate text-[11px] ${
            active ? 'text-neutral-300' : 'text-neutral-500'
          }`}
        >
          {description}
        </span>
      </button>
    </li>
  );
}
