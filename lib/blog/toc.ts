export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export const slugifyHeading = (raw: string): string => {
  const base = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
  return base || 'heading';
};

export const extractToc = (markdown: string): TocEntry[] => {
  const lines = markdown.split('\n');
  const entries: TocEntry[] = [];
  const used = new Map<string, number>();
  let inFence = false;

  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const level = match[1].length === 2 ? 2 : 3;
    const text = match[2].replace(/[`*_]/g, '').trim();
    if (!text) continue;
    let id = slugifyHeading(text);
    const count = used.get(id) ?? 0;
    if (count > 0) id = `${id}-${count}`;
    used.set(slugifyHeading(text), count + 1);
    entries.push({ id, text, level: level as 2 | 3 });
  }
  return entries;
};

export const estimateReadingMinutes = (markdown: string): number => {
  const words = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 250));
};
