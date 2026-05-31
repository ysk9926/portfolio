'use client';

import { useEffect, useState } from 'react';
import type { Highlighter } from 'shiki';

interface CodeBlockProps {
  code: string;
  language: string;
}

let highlighterPromise: Promise<Highlighter> | null = null;

const SUPPORTED_LANGS = new Set([
  'typescript', 'ts', 'tsx', 'javascript', 'js', 'jsx',
  'bash', 'sh', 'shell', 'zsh',
  'json', 'yaml', 'yml', 'toml',
  'css', 'scss', 'html', 'xml',
  'python', 'py', 'go', 'rust', 'java', 'kotlin', 'swift',
  'sql', 'graphql', 'markdown', 'md', 'dockerfile', 'diff',
]);

const normalize = (lang: string): string => {
  const l = lang.toLowerCase();
  if (l === 'shell' || l === 'zsh') return 'bash';
  if (l === 'py') return 'python';
  if (l === 'md') return 'markdown';
  if (l === 'yml') return 'yaml';
  return l;
};

const getHighlighter = async (): Promise<Highlighter> => {
  if (!highlighterPromise) {
    const { createHighlighter } = await import('shiki');
    highlighterPromise = createHighlighter({
      themes: ['github-dark-dimmed'],
      langs: Array.from(SUPPORTED_LANGS).filter(
        (l) => !['ts', 'js', 'sh', 'shell', 'zsh', 'py', 'md', 'yml'].includes(l),
      ),
    });
  }
  return highlighterPromise;
};

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const normalizedLang = normalize(language);
  const isSupported = SUPPORTED_LANGS.has(normalizedLang);

  useEffect(() => {
    if (!isSupported) return;
    let cancelled = false;
    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return;
        const out = highlighter.codeToHtml(code, {
          lang: normalizedLang,
          theme: 'github-dark-dimmed',
        });
        setHtml(out);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, normalizedLang, isSupported]);

  if (isSupported && html) {
    return (
      <div
        className="my-5 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm leading-relaxed [&_pre]:bg-transparent [&_pre]:m-0 [&_pre]:p-0 [&_code]:bg-transparent [&_code]:p-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <pre className="my-5 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm leading-relaxed text-neutral-100">
      <code className="font-mono">{code}</code>
    </pre>
  );
}
