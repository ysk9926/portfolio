'use client';

/**
 * Ported from @poooling/design-system `modal.tsx` (zespro, v0.1.25).
 * Portal + backdrop shell: Escape/backdrop close, focus trap and restore, body scroll lock.
 * Local additions: `dialogProps` so callers can attach data attributes to the dialog panel.
 */
import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from './class-names';
import { CloseIcon } from './icons';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  "[tabindex]:not([tabindex='-1'])",
].join(',');

let openModalCount = 0;
let originalBodyOverflow = '';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  ariaLabel?: string;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  /** Extra attributes (e.g. data-*) applied to the dialog panel. */
  dialogProps?: HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string | number | undefined>;
};

export function Modal({
  open,
  onClose,
  children,
  title,
  ariaLabel,
  closeLabel = '닫기',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = false,
  className,
  contentClassName,
  style,
  dialogProps,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (openModalCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openModalCount += 1;

    const frame = window.requestAnimationFrame(() => {
      const preferred = dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]');
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (preferred ?? firstFocusable ?? dialogRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      openModalCount = Math.max(0, openModalCount - 1);
      if (openModalCount === 0) document.body.style.overflow = originalBodyOverflow;
      previouslyFocused?.focus();
    };
  }, [closeOnEscape, open]);

  if (!open || typeof document === 'undefined') return null;

  const handleBackdropPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose();
  };

  return createPortal(
    <div
      className={cx('pds pds-modal-backdrop', className)}
      role="presentation"
      onPointerDown={handleBackdropPointerDown}
    >
      <div
        {...dialogProps}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={cx('pds-modal', contentClassName, dialogProps?.className)}
        style={style}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 id={titleId} className="pds-sr-only">
            {title}
          </h2>
        ) : null}
        {showCloseButton ? (
          <button
            type="button"
            className="pds-modal-floating-close"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <CloseIcon size={18} />
          </button>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
