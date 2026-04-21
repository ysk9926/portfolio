import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminContext } from '@/lib/admin';

export const metadata: Metadata = {
  title: 'Portfolio Admin',
  robots: { index: false, follow: false },
};

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
