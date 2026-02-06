import { AboutItem } from '@/lib/types';

export default function InfoCard({ icon, label, value }: AboutItem) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-base font-medium text-gray-900">{value}</div>
    </div>
  );
}
