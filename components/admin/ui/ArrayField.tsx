'use client';

import { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface ArrayFieldProps<T> {
  items: T[];
  onChange: (next: T[]) => void;
  createEmpty: () => T;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  itemLabel?: (item: T, index: number) => string;
  addLabel?: string;
  emptyLabel?: string;
  sortable?: boolean;
}

export function ArrayField<T>({
  items,
  onChange,
  createEmpty,
  renderItem,
  itemLabel,
  addLabel = '항목 추가',
  emptyLabel = '항목이 없습니다. 추가 버튼을 눌러 시작하세요.',
  sortable = true,
}: ArrayFieldProps<T>) {
  const updateAt = (index: number, patch: Partial<T>) => {
    const next = items.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    onChange([...items, createEmpty()]);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 px-4 py-6 text-center text-xs text-neutral-500">
          {emptyLabel}
        </div>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-neutral-200 bg-neutral-50/40"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-2">
            <span className="text-xs font-medium text-neutral-600">
              {itemLabel ? itemLabel(item, index) : `#${index + 1}`}
            </span>
            <div className="flex items-center gap-1">
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
                variant="ghost"
                size="sm"
                onClick={() => removeAt(index)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                aria-label="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-3 px-3 py-3">
            {renderItem(item, index, (patch) => updateAt(index, patch))}
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" size="sm" onClick={add} iconLeft={<Plus className="h-3.5 w-3.5" />}>
        {addLabel}
      </Button>
    </div>
  );
}

interface StringArrayFieldProps {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}

export function StringArrayField({
  items,
  onChange,
  placeholder,
  addLabel = '추가',
}: StringArrayFieldProps) {
  const updateAt = (index: number, value: string) => {
    const next = items.slice();
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const add = () => onChange([...items, '']);

  return (
    <div className="space-y-2">
      {items.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={value}
            placeholder={placeholder}
            onChange={(event) => updateAt(index, event.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeAt(index)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            aria-label="삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={add} iconLeft={<Plus className="h-3.5 w-3.5" />}>
        {addLabel}
      </Button>
    </div>
  );
}
