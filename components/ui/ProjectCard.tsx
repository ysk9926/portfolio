import { Project } from '@/lib/types';

export default function ProjectCard({
  title,
  period,
  description,
  features,
  techStack,
  deployUrl,
  githubUrl,
}: Project) {
  return (
    <div className="rounded-2xl bg-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      <div className="p-6 md:p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{period}</p>
        <p className="text-gray-700 mb-6">{description}</p>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">주요 기능</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-600">
                <span className="text-blue-500 mt-1">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">기술 스택</h4>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg text-center transition-colors"
            >
              배포 사이트
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg text-center transition-colors"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
