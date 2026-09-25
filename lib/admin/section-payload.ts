import type { SectionKey } from '@/lib/types/payload';

export function currentSectionPayload(
  sectionKey: SectionKey,
  loadedSectionKey: SectionKey | null,
  payload: unknown,
): unknown | null {
  return sectionKey === loadedSectionKey ? payload : null;
}
