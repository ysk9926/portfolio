'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, MessageSquare, Newspaper, Plus } from 'lucide-react';
import { ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '../ui/Button';

interface AdminBlogShellProps {
  adminEmail: string;
  children: ReactNode;
}

export default function AdminBlogShell({ adminEmail, children }: AdminBlogShellProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';

  const isPosts = pathname === '/admin/blog' || pathname.startsWith('/admin/blog/');
  const isCommentTab = pathname === '/admin/blog?tab=comments';

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-shrink-0 border-r border-neutral-200 bg-white md:flex md:flex-col">
          <div className="border-b border-neutral-200 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Portfolio Admin
            </p>
            <h1 className="mt-0.5 text-base font-bold text-neutral-900">블로그</h1>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-5">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                포스트
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/admin/blog"
                    className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      isPosts && !isCommentTab
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Newspaper className="h-4 w-4" /> 글 목록
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/blog/new"
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
                  >
                    <Plus className="h-4 w-4" /> 새 글
                  </Link>
                </li>
              </ul>
            </div>
            <div className="mb-5">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                관리
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/admin/blog?tab=comments"
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
                  >
                    <MessageSquare className="h-4 w-4" /> 댓글 관리
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100"
                  >
                    <ArrowLeft className="h-4 w-4" /> 섹션 편집으로
                  </Link>
                </li>
              </ul>
            </div>
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
                Portfolio Admin
              </p>
              <h1 className="text-sm font-bold">블로그</h1>
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

          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
