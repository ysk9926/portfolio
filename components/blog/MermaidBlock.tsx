'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidBlockProps {
  code: string;
}

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;
let renderId = 0;

const getMermaid = async () => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        securityLevel: 'strict',
        fontFamily: 'Pretendard, ui-sans-serif, system-ui, sans-serif',
        themeVariables: {
          background: '#FAFAFA',
          primaryColor: '#FFFFFF',
          primaryBorderColor: '#A3A3A3',
          primaryTextColor: '#171717',
          lineColor: '#525252',
          secondaryColor: '#F5F5F5',
          tertiaryColor: '#FAFAFA',
          fontSize: '14px',
        },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
};

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-svg-${++renderId}`;
    getMermaid()
      .then(async (mermaid) => {
        try {
          const { svg: rendered } = await mermaid.render(id, code.trim());
          if (!cancelled) {
            setSvg(rendered);
            setError(null);
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : '다이어그램을 렌더링하지 못했습니다.');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '다이어그램 라이브러리를 불러오지 못했습니다.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="my-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs text-neutral-500">다이어그램 렌더링 실패</p>
        <pre className="mt-2 overflow-x-auto text-xs text-neutral-700">{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-5 flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-sm text-neutral-500">
        다이어그램을 그리는 중…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-5 flex justify-center overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
