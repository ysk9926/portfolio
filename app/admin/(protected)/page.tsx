import AdminSectionEditor from '@/components/admin/AdminSectionEditor';
import { getAdminContext } from '@/lib/admin';

export default async function AdminPage() {
  const adminContext = await getAdminContext();

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-neutral-900">Portfolio Admin</h1>
          <p className="mt-1 text-sm text-neutral-500">
            로그인: {adminContext.adminEmail ?? adminContext.user?.email ?? 'unknown'}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            섹션 JSON 수정 후 저장하면 정규화 테이블이 트랜잭션으로 교체됩니다.
          </p>
        </div>

        <AdminSectionEditor />
      </div>
    </div>
  );
}
