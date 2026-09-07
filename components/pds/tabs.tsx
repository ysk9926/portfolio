'use client';

/** Ported from @poooling/design-system `tabs.tsx` (zespro, v0.1.25). */
import { Fragment, type ReactNode } from 'react';
import { cx } from './class-names';

export type TabItem<T extends string = string> = {
  key: T;
  label: ReactNode;
  icon?: ReactNode;
  /** 라벨 옆 카운트 배지 */
  meta?: ReactNode;
  /** "end"면 이 항목부터 오른쪽 끝으로 밀어낸다 */
  align?: 'start' | 'end';
  disabled?: boolean;
};

export type TabsProps<T extends string> = {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  variant?: 'underline' | 'segmented';
  size?: 'medium' | 'small';
  bordered?: boolean;
  className?: string;
  itemClassName?: string;
  ariaLabel?: string;
};

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'underline',
  size = 'medium',
  bordered = true,
  className,
  itemClassName,
  ariaLabel,
}: TabsProps<T>) {
  const firstEndIndex = items.findIndex((item) => item.align === 'end');

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        'pds',
        'pds-tabs',
        `pds-tabs--${variant}`,
        `pds-tabs--${size}`,
        bordered && variant === 'underline' && 'pds-tabs--bordered',
        className,
      )}
    >
      {items.map((item, index) => {
        const active = item.key === value;
        const shouldInsertSpacer = index === firstEndIndex;

        return (
          <Fragment key={item.key}>
            {shouldInsertSpacer ? <span className="pds-tabs__spacer" /> : null}
            <button
              type="button"
              role="tab"
              aria-selected={active}
              disabled={item.disabled}
              onClick={() => onChange(item.key)}
              className={cx(
                'pds-tabs__tab',
                active && 'is-active',
                item.disabled && 'is-disabled',
                itemClassName,
              )}
            >
              {item.icon ? <span className="pds-tabs__icon">{item.icon}</span> : null}
              <span className="pds-tabs__label">{item.label}</span>
              {item.meta !== undefined ? <span className="pds-tabs__meta">{item.meta}</span> : null}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
