import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { getAdminContext } from '@/lib/admin';

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const adminContext = await getAdminContext();

  if (adminContext.user && adminContext.isAdmin) {
    redirect('/admin');
  }

  return <AdminLoginForm />;
}
