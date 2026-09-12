'use client';

/**
 * Shared list-section editing shell for the admin.
 *
 * Sections whose payload is an array (projects, career, archiving, skills,
 * about) render a compact row list here and do the actual editing inside the
 * same `SplitModal` shell the public site uses for project details, so the
 * admin and the visitor-facing surface read as one UI.
 *
 * The modal edits a *draft copy*: changes are committed to the section payload
 * only on 확인, so 취소/Escape discards them.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { SplitModal, type SplitModalFactGroup, type SplitModalStat, type SplitModalTab } from '../../pds/split-modal';
import { Button } from './Button';

/** One tab of the edit modal. `render` receives the draft and a patcher. */
export interface EntityEditorTab<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  render: (draft: T, update: (patch: Partial<T>) => void) => ReactNode;
}

export interface EntityListEditorProps<T> {
  items: T[];
  onChange: (next: T[]) => void;
  createEmpty: () => T;
  /** Primary row label, also the modal title. */
  itemTitle: (item: T, index: number) => string;
  /** Optional muted text shown under the row title. */
  itemSubtitle?: (item: T, index: number) => string | undefined;
  /** Small pill at the far left of the row (e.g. "#3"). */
  itemBadge?: (item: T, index: number) => string | undefined;
  /** Eyebrow pill above the modal title. */
  itemEyebrow?: (item: T, index: number) => string;
  /** Rail fact groups, mirroring the public modal's summary rail. */
  factGroups?: (draft: T) => SplitModalFactGroup[];
  /** Stat strip across the top of the modal content. */
  stats?: (draft: T) => SplitModalStat[];
  /** Extra rail content under the facts (e.g. tech chips). */
  rail?: (draft: T) => ReactNode;
  tabs: EntityEditorTab<T>[];
  addLabel?: string;
  emptyLabel?: string;
  sortable?: boolean;
  /** Accent tone class, e.g. "company" | "personal". */
  tone?: (item: T) => string;
}

/** `null` = closed, `-1` = a newly added draft not yet in `items`. */
type EditingIndex = number | null;

export function EntityListEditor<T>({
  items,
  onChange,
  createEmpty,
  itemTitle,
  itemSubtitle,
  itemBadge,
  itemEyebrow,
  factGroups,
  stats,
  rail,
  tabs,
  addLabel = '항목 추가',
  emptyLabel = '항목이 없습니다. 추가 버튼을 눌러 시작하세요.',
  sortable = true,
  tone,
}: EntityListEditorProps<T>) {
  const [editingIndex, setEditingIndex] = useState<EditingIndex>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [tab, setTab] = useState<string>(tabs[0]?.key ?? '');

  const closeModal = useCallback(() => {
    setEditingIndex(null);
    setDraft(null);
  }, []);

  const openEditor = (index: number, initial: T) => {
    setDraft(structuredClone(initial));
    setEditingIndex(index);
    setTab(tabs[0]?.key ?? '');
  };

  const handleAdd = () => openEditor(-1, createEmpty());

  const handleRemove = (index: number) => {
    if (!window.confirm(`"${itemTitle(items[index], index)}" 항목을 삭제할까요?`)) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const handleConfirm = () => {
    if (draft === null || editingIndex === null) return;
    if (editingIndex === -1) {
      onChange([...items, draft]);
    } else {
      const next = items.slice();
      next[editingIndex] = draft;
      onChange(next);
    }
    closeModal();
  };

  const updateDraft = useCallback((patch: Partial<T>) => {
    setDraft((current) => (current === null ? current : { ...current, ...patch }));
  }, []);

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 px-4 py-6 text-center text-xs text-neutral-500">
          {emptyLabel}
        </div>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          {items.map((item, index) => {
            const badge = itemBadge?.(item, index);
            const subtitle = itemSubtitle?.(item, index);
            return (
              <li
                key={index}
                className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-neutral-50"
              >
                {badge && (
                  <span className="flex-shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500">
                    {badge}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => openEditor(index, item)}
                  className="flex min-w-0 flex-1 cursor-pointer flex-col items-start text-left"
                >
                  <span className="w-full truncate text-sm font-medium text-neutral-900">
                    {itemTitle(item, index) || '(제목 없음)'}
                  </span>
                  {subtitle && (
                    <span className="w-full truncate text-xs text-neutral-500">{subtitle}</span>
                  )}
                </button>

                <div className="flex flex-shrink-0 items-center gap-1">
                  {sortable && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label="위로 이동"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => move(index, 1)}
                        disabled={index === items.length - 1}
                        aria-label="아래로 이동"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditor(index, item)}
                    iconLeft={<Pencil className="h-3.5 w-3.5" />}
                  >
                    수정
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleAdd}
        iconLeft={<Plus className="h-3.5 w-3.5" />}
      >
        {addLabel}
      </Button>

      {draft !== null && editingIndex !== null && (
        <EntityEditorModal
          draft={draft}
          isNew={editingIndex === -1}
          index={editingIndex === -1 ? items.length : editingIndex}
          title={itemTitle}
          eyebrow={itemEyebrow}
          factGroups={factGroups}
          stats={stats}
          rail={rail}
          tabs={tabs}
          tab={tab}
          onTabChange={setTab}
          tone={tone}
          onUpdate={updateDraft}
          onConfirm={handleConfirm}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}

interface EntityEditorModalProps<T> {
  draft: T;
  isNew: boolean;
  index: number;
  title: (item: T, index: number) => string;
  eyebrow?: (item: T, index: number) => string;
  factGroups?: (draft: T) => SplitModalFactGroup[];
  stats?: (draft: T) => SplitModalStat[];
  rail?: (draft: T) => ReactNode;
  tabs: EntityEditorTab<T>[];
  tab: string;
  onTabChange: (tab: string) => void;
  tone?: (item: T) => string;
  onUpdate: (patch: Partial<T>) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function EntityEditorModal<T>({
  draft,
  isNew,
  index,
  title,
  eyebrow,
  factGroups,
  stats,
  rail,
  tabs,
  tab,
  onTabChange,
  tone,
  onUpdate,
  onConfirm,
  onCancel,
}: EntityEditorModalProps<T>) {
  // Cmd/Ctrl+Enter confirms, matching the "save" affordance of the section editor.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onConfirm]);

  const modalTabs = useMemo<SplitModalTab<string>[]>(
    () => tabs.map(({ key, label, icon }) => ({ key, label, icon })),
    [tabs],
  );

  const activeTab = tabs.find((item) => item.key === tab) ?? tabs[0];
  const headingText = title(draft, index) || (isNew ? '새 항목' : '(제목 없음)');
  const toneClass = tone ? `pds-tone-${tone(draft)}` : undefined;

  return (
    <SplitModal<string>
      open
      onClose={onCancel}
      ariaLabel={headingText}
      closeLabel="닫기"
      rootClassName={toneClass}
      railWidth={260}
      // A stray backdrop click must not silently drop an in-progress edit.
      closeOnBackdrop={false}
      profile={{
        eyebrow: (
          <span className="pds-eyebrow-pill">
            <span aria-hidden className="pds-eyebrow-pill__dot" />
            {isNew ? '새 항목' : (eyebrow?.(draft, index) ?? '편집')}
          </span>
        ),
        title: headingText,
      }}
      factGroups={factGroups?.(draft)}
      rail={rail?.(draft)}
      railFooter={
        <div className="pds-split-modal__actions">
          <button type="button" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="is-primary" onClick={onConfirm}>
            확인
          </button>
        </div>
      }
      tabs={modalTabs}
      tab={activeTab?.key ?? ''}
      onTabChange={onTabChange}
      tabsAriaLabel={`${headingText} 편집`}
      stats={stats?.(draft)}
    >
      <div className="px-4 py-4 md:px-5">{activeTab?.render(draft, onUpdate)}</div>
    </SplitModal>
  );
}
