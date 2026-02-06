import { CareerEntry } from '@/lib/types';

export default function CareerItem({
  company,
  role,
  period,
  description,
  achievements,
}: CareerEntry) {
  return (
    <div className="border-l-4 border-blue-500 pl-6 pb-8">
      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
        {company}
      </h3>
      <p className="text-base md:text-lg text-gray-700 mb-2">{role}</p>
      <p className="text-sm text-gray-500 mb-4">{period}</p>
      <p className="text-gray-700 mb-4">{description}</p>

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">주요 성과</h4>
        <ul className="space-y-2">
          {achievements.map((achievement, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-600">
              <span className="text-blue-500 mt-1">•</span>
              <span>{achievement}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
