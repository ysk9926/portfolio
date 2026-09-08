import { FooterData } from '@/lib/types/view';

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
    </footer>
  );
}
