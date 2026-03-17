import { Check } from 'lucide-react';
import { ArchiveItem } from '@/lib/types';

export default function ArchiveCard({
  title,
  description,
  url,
  details,
}: ArchiveItem) {
  const isGitHub = title.toLowerCase().includes('github');
  const cardClass = isGitHub
    ? 'bg-neutral-900 text-white'
    : 'bg-neutral-100 text-gray-900';

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-2xl p-8 md:p-10 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300 ${cardClass}`}
    >
      <h3 className="text-2xl md:text-3xl font-bold">{title}</h3>
      <p className={`text-base ${isGitHub ? 'text-gray-300' : 'text-gray-600'}`}>
        {description}
      </p>
      <ul className="space-y-2">
        {details.map((detail, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className={`mt-1 shrink-0 ${isGitHub ? 'text-neutral-400' : 'text-neutral-600'}`} size={16} strokeWidth={2.5} />
            <span className={isGitHub ? 'text-gray-200' : 'text-gray-700'}>
              {detail}
            </span>
          </li>
        ))}
      </ul>
    </a>
  );
}
