import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admin';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminContext = await getAdminContext();

  if (!adminContext.user) {
    redirect('/admin/login');
  }

  if (!adminContext.isAdmin) {
    redirect('/admin/login?error=forbidden');
  }

  return <>{children}</>;
}
