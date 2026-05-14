import AdminBlogShell from '@/components/admin/blog/AdminBlogShell';
import AdminCommentList, {
  AdminCommentRow,
} from '@/components/admin/blog/AdminCommentList';
import AdminPostList from '@/components/admin/blog/AdminPostList';
import { listAllPosts } from '@/lib/blog/server';
import { getAdminContext } from '@/lib/admin';
import { createServerSupabaseClient } from '@/utils/supabase/server';

interface AdminBlogPageProps {
  searchParams: Promise<{ tab?: string }>;
}

const loadComments = async (): Promise<AdminCommentRow[]> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blog_comments')
    .select(
      'id, nickname, body, is_deleted, created_at, parent_id, post_id, blog_posts!inner(slug, title)',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<{
    id: number;
    nickname: string;
    body: string;
    is_deleted: boolean;
    created_at: string;
    parent_id: number | null;
    post_id: number;
    blog_posts: { slug: string; title: string } | { slug: string; title: string }[] | null;
  }>;

  return rows.map((row) => {
    const post = Array.isArray(row.blog_posts) ? row.blog_posts[0] : row.blog_posts;
    return {
      id: row.id,
      postSlug: post?.slug ?? '',
      postTitle: post?.title ?? '(알 수 없음)',
      nickname: row.nickname,
      body: row.is_deleted ? '' : row.body,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      parentId: row.parent_id,
    };
  });
};

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const params = await searchParams;
  const adminContext = await getAdminContext();
  const adminEmail = adminContext.adminEmail ?? adminContext.user?.email ?? 'unknown';

  const tab = params.tab === 'comments' ? 'comments' : 'posts';

  return (
    <AdminBlogShell adminEmail={adminEmail}>
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
        {tab === 'comments' ? (
          <AdminCommentList comments={await loadComments()} />
        ) : (
          <AdminPostList posts={await listAllPosts()} />
        )}
      </div>
    </AdminBlogShell>
  );
}
