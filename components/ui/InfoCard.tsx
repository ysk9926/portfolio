import { User, Calendar, Mail, GraduationCap, Smartphone, MapPin, LucideIcon } from 'lucide-react';
import { AboutItem } from '@/lib/types';

const iconMap: Record<string, LucideIcon> = {
  user: User,
  calendar: Calendar,
  mail: Mail,
  'graduation-cap': GraduationCap,
  smartphone: Smartphone,
  'map-pin': MapPin,
};

export default function InfoCard({ icon, label, value }: AboutItem) {
  const IconComponent = iconMap[icon];
  return (
    <div className="bg-neutral-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-3">
        {IconComponent ? (
          <IconComponent className="w-8 h-8 text-neutral-700" strokeWidth={1.5} />
        ) : (
          <span className="text-3xl">{icon}</span>
        )}
      </div>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-base font-medium text-gray-900">{value}</div>
    </div>
  );
}
