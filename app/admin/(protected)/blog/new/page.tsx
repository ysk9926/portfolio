import AdminBlogShell from '@/components/admin/blog/AdminBlogShell';
import AdminPostEditor from '@/components/admin/blog/AdminPostEditor';
import { getAdminContext } from '@/lib/admin';

export default async function AdminBlogNewPage() {
  const adminContext = await getAdminContext();
  const adminEmail = adminContext.adminEmail ?? adminContext.user?.email ?? 'unknown';

  return (
    <AdminBlogShell adminEmail={adminEmail}>
      <AdminPostEditor mode="create" />
    </AdminBlogShell>
  );
}
