import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { getAdminContext } from '@/lib/admin';

export default async function AdminLoginPage() {
  const adminContext = await getAdminContext();

  if (adminContext.user && adminContext.isAdmin) {
    redirect('/admin');
  }

  return <AdminLoginForm />;
}
