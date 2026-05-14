'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { slugifyHeading } from '@/lib/blog/toc';

interface BlogMarkdownProps {
  content: string;
}

const used = new Map<string, number>();

const headingId = (rawText: unknown): string => {
  const raw = typeof rawText === 'string' ? rawText : Array.isArray(rawText) ? rawText.join(' ') : '';
  const base = slugifyHeading(raw);
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
};

const flattenChildren = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(flattenChildren).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return flattenChildren((children as { props: { children?: React.ReactNode } }).props.children);
  }
  return '';
};

const components: Components = {
  h2: ({ children }) => {
    const id = headingId(flattenChildren(children));
    return (
      <h2
        id={id}
        className="scroll-mt-24 text-2xl font-bold text-gray-900 mt-10 mb-4 first:mt-0"
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const id = headingId(flattenChildren(children));
    return (
      <h3 id={id} className="scroll-mt-24 text-xl font-semibold text-gray-900 mt-8 mb-3">
        {children}
      </h3>
    );
  },
  h4: ({ children }) => (
    <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 leading-relaxed my-4">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-4 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-4 list-decimal space-y-1 pl-6">{children}</ol>,
  li: ({ children }) => <li className="text-gray-700 leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-5 border-l-4 border-neutral-400 bg-neutral-50 px-4 py-2 italic text-gray-700">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className={`${className} block overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm leading-relaxed text-neutral-100`}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.92em] text-neutral-800">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="my-5">{children}</pre>,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === 'string' ? src : ''}
      alt={alt ?? ''}
      className="my-6 mx-auto max-w-full rounded-lg"
    />
  ),
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-neutral-300 bg-neutral-100 px-3 py-2 text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-neutral-200 px-3 py-2">{children}</td>
  ),
  hr: () => <hr className="my-8 border-neutral-200" />,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
};

export default function BlogMarkdown({ content }: BlogMarkdownProps) {
  used.clear();
  return (
    <div className="text-base leading-7">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
