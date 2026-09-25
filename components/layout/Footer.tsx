import { FooterData } from '@/lib/types/view';
import Link from 'next/link';

interface FooterProps {
  footerData: FooterData;
}

export default function Footer({ footerData }: FooterProps) {
  return (
    <footer className="ai-ink border-t border-white/10 py-12 text-center text-neutral-300">
      <p className="inline-flex items-center gap-2 font-mono text-xs text-neutral-400">
        <span aria-hidden className="text-ai-accent">$</span>
        {footerData.builtWith.toLowerCase()}
        <span aria-hidden className="inline-block h-3 w-[6px] animate-caret-blink bg-ai-accent/80" />
      </p>
      <p className="mt-3 text-sm text-neutral-500">{footerData.copyright}</p>
      <nav aria-label="추가 링크" className="mt-4 flex justify-center gap-5 text-sm">
        <Link href="/blog" data-analytics-target="blog" className="underline decoration-white/30 underline-offset-4 hover:text-white">Blog</Link>
        <a href="https://github.com/ysk9926" target="_blank" rel="noopener noreferrer" data-analytics-target="github" className="underline decoration-white/30 underline-offset-4 hover:text-white">GitHub</a>
      </nav>
    </footer>
  );
}
