import AdminSectionEditor from '@/components/admin/AdminSectionEditor';
import { getAdminContext } from '@/lib/admin';

export default async function AdminPage() {
  const adminContext = await getAdminContext();
  const adminEmail =
    adminContext.adminEmail ?? adminContext.user?.email ?? 'unknown';

  return <AdminSectionEditor adminEmail={adminEmail} />;
}
