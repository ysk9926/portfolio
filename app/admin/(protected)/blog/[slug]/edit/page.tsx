import { notFound } from 'next/navigation';
import AdminBlogShell from '@/components/admin/blog/AdminBlogShell';
import AdminPostEditor from '@/components/admin/blog/AdminPostEditor';
import { getAdminContext } from '@/lib/admin';
import { getPostBySlug } from '@/lib/blog/server';

interface AdminBlogEditPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminBlogEditPage({ params }: AdminBlogEditPageProps) {
  const { slug } = await params;
  const adminContext = await getAdminContext();
  const adminEmail = adminContext.adminEmail ?? adminContext.user?.email ?? 'unknown';

  const post = await getPostBySlug(slug, { allowDraft: true });
  if (!post) notFound();

  return (
    <AdminBlogShell adminEmail={adminEmail}>
      <AdminPostEditor mode="edit" initial={post} />
    </AdminBlogShell>
  );
}
