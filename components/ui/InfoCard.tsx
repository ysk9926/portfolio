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
    <div className="paper-card flex h-full flex-col rounded-2xl p-5 transition-colors hover:border-ai-ink/25 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-[0.16em] text-neutral-500">{label}</span>
        {IconComponent ? (
          <IconComponent className="h-4 w-4 text-ai-accent" strokeWidth={1.75} aria-hidden />
        ) : (
          <span className="text-base" aria-hidden>{icon}</span>
        )}
      </div>
      <div className="mt-4 text-sm font-semibold text-ai-ink [overflow-wrap:anywhere] md:text-lg">{value}</div>
    </div>
  );
}
