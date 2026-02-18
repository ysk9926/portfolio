'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  h2: ({ children }) => (
    <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="text-base font-semibold text-gray-800 mt-3 mb-1.5">{children}</h4>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className={`${className} block bg-gray-100 rounded-lg p-3 text-sm overflow-x-auto`}>
          {children}
        </code>
      );
    }
    return (
      <code className="bg-gray-100 text-blue-600 rounded px-1.5 py-0.5 text-sm font-mono">
        {children}
      </code>
    );
  },
  ul: ({ children }) => (
    <ul className="space-y-1.5 my-2">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-gray-600">
      <span className="text-blue-400 mt-1 shrink-0 text-xs">▶</span>
      <span>{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-blue-300 pl-3 italic text-gray-600 my-2">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 underline hover:text-blue-600 transition-colors"
    >
      {children}
    </a>
  ),
  p: ({ children }) => (
    <p className="text-gray-600 leading-relaxed my-1.5">{children}</p>
  ),
};

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm prose-gray max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
