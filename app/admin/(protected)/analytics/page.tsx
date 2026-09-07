import { getAdminContext } from "@/lib/admin";
import AnalyticsShell from "@/components/admin/analytics/AnalyticsShell";
import AnalyticsDashboard from "@/components/admin/analytics/AnalyticsDashboard";
export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getAdminContext();
  return (
    <AnalyticsShell adminEmail={admin.adminEmail ?? ""}>
      <AnalyticsDashboard initialSearch={await searchParams} />
    </AnalyticsShell>
  );
}
