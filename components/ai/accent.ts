import type { AiCommandKind, AiSkillClient, AiToolAccent } from '@/lib/types/view';

interface AccentStyle {
  /** Solid dot / caret color on dark panels. */
  dot: string;
  /** Text color for mono labels on dark panels. */
  text: string;
  /** Soft badge on light surfaces. */
  badge: string;
  /** Border glow on dark panels. */
  ring: string;
}

export const TOOL_ACCENTS: Record<AiToolAccent, AccentStyle> = {
  claude: {
    dot: 'bg-ai-accent',
    text: 'text-ai-accent',
    badge: 'bg-ai-accent-soft text-[#8a3f22]',
    ring: 'hover:border-ai-accent/60',
  },
  codex: {
    dot: 'bg-ai-codex',
    text: 'text-ai-codex',
    badge: 'bg-ai-codex-soft text-[#0b5c47]',
    ring: 'hover:border-ai-codex/60',
  },
  product: {
    dot: 'bg-ai-product',
    text: 'text-ai-product',
    badge: 'bg-ai-product-soft text-[#1e3a8a]',
    ring: 'hover:border-ai-product/60',
  },
};

export const CLIENT_BADGES: Record<AiSkillClient, string> = {
  공용: 'bg-neutral-900 text-white',
  Claude: 'bg-ai-accent-soft text-[#8a3f22]',
  Codex: 'bg-ai-codex-soft text-[#0b5c47]',
};

export const COMMAND_KINDS: Record<AiCommandKind, { label: string; className: string }> = {
  slash: { label: 'slash', className: 'bg-ai-accent-soft text-[#8a3f22]' },
  hook: { label: 'hook', className: 'bg-ai-product-soft text-[#1e3a8a]' },
  automation: { label: 'daily', className: 'bg-ai-codex-soft text-[#0b5c47]' },
  script: { label: 'script', className: 'bg-neutral-200 text-neutral-700' },
};
