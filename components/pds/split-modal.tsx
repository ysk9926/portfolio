'use client';

/**
 * Ported from @poooling/design-system `split-modal.tsx` (zespro, v0.1.25).
 * Standard detail-modal shell: left summary rail + right tabbed content.
 * Local additions: `dialogProps` passthrough for analytics data attributes.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cx } from './class-names';
import { CloseIcon } from './icons';
import { Modal, type ModalProps } from './modal';
import { Tabs, type TabItem } from './tabs';

export type SplitModalTab<TabKey extends string = string> = Omit<TabItem<TabKey>, 'meta'>;

export type SplitModalFact = {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  title?: string;
  tone?: 'default' | 'accent';
};

export type SplitModalFactGroup = { label: ReactNode; facts: readonly SplitModalFact[] };

export type SplitModalStat = { icon?: ReactNode; label: ReactNode; value: ReactNode; note?: ReactNode };

export type SplitModalProfile = { eyebrow?: ReactNode; title: ReactNode };

export type SplitModalLayoutProps<TabKey extends string> = {
  onClose: () => void;
  closeLabel?: string;
  profile?: SplitModalProfile;
  facts?: readonly SplitModalFact[];
  factGroups?: readonly SplitModalFactGroup[];
  rail?: ReactNode;
  railActions?: ReactNode;
  railFooter?: ReactNode;
  tabs: readonly SplitModalTab<TabKey>[];
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
  tabsAriaLabel: string;
  tabbarExtra?: ReactNode;
  stats?: readonly SplitModalStat[];
  statsColumns?: number;
  layoutClassName?: string;
  children: ReactNode;
};

export type SplitModalProps<TabKey extends string> = SplitModalLayoutProps<TabKey> & {
  open: boolean;
  ariaLabel: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  /** 좌측 레일 폭 (기본 238px) */
  railWidth?: CSSProperties['width'];
  rootClassName?: string;
  className?: string;
  dialogProps?: ModalProps['dialogProps'];
};

function SplitModalFactList({ facts }: { facts: readonly SplitModalFact[] }) {
  return (
    <dl className="pds-split-modal__facts">
      {facts.map((fact, index) => (
        <div key={index}>
          <dt>
            {fact.icon}
            <span>{fact.label}</span>
          </dt>
          <dd
            className={fact.tone === 'accent' ? 'is-accent' : undefined}
            title={fact.title ?? (typeof fact.value === 'string' ? fact.value : undefined)}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function SplitModalRow({ label, value, title }: { label: ReactNode; value: ReactNode; title?: string }) {
  return (
    <div className="pds-split-modal__row">
      <span>{label}</span>
      <strong title={title}>{value}</strong>
    </div>
  );
}

export type SplitModalSectionProps = {
  icon?: ReactNode;
  title: ReactNode;
  note?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SplitModalSection({ icon, title, note, actions, className, children }: SplitModalSectionProps) {
  return (
    <section className={cx('pds-split-modal-section', className)}>
      <header>
        <div>
          {icon ? <span className="pds-split-modal-section__icon">{icon}</span> : null}
          <b>{title}</b>
          {note != null ? <span className="pds-split-modal-section__note">{note}</span> : null}
        </div>
        {actions ? <div className="pds-split-modal-section__actions">{actions}</div> : null}
      </header>
      <div className="pds-split-modal-section__body">{children}</div>
    </section>
  );
}

export function SplitModalLayout<TabKey extends string>({
  onClose,
  closeLabel = '닫기',
  profile,
  facts,
  factGroups,
  rail,
  railActions,
  railFooter,
  tabs,
  tab,
  onTabChange,
  tabsAriaLabel,
  tabbarExtra,
  stats,
  statsColumns = 3,
  layoutClassName,
  children,
}: SplitModalLayoutProps<TabKey>) {
  const tabItems: TabItem<TabKey>[] = tabs.map(({ key, label, icon, align, disabled }) => ({
    key,
    label,
    icon,
    align,
    disabled,
  }));
  const hasRail = Boolean(profile || facts?.length || factGroups?.length || rail || railActions || railFooter);

  return (
    <div className={cx('pds', 'pds-split-modal__layout', !hasRail && 'is-railless', layoutClassName)}>
      {hasRail ? (
        <aside className="pds-split-modal__rail">
          {profile ? (
            <div className="pds-split-modal__profile">
              {profile.eyebrow != null ? <span>{profile.eyebrow}</span> : null}
              <h2>{profile.title}</h2>
            </div>
          ) : null}
          {facts?.length ? <SplitModalFactList facts={facts} /> : null}
          {factGroups?.length ? (
            <div className="pds-split-modal__fact-groups">
              {factGroups.map((group, index) => (
                <section className="pds-split-modal__fact-group" key={index}>
                  <h3 className="pds-split-modal__fact-group-label">{group.label}</h3>
                  <SplitModalFactList facts={group.facts} />
                </section>
              ))}
            </div>
          ) : null}
          {rail ? <div className="pds-split-modal__rail-body">{rail}</div> : null}
          {railActions ? <div className="pds-split-modal__actions">{railActions}</div> : null}
          {railFooter ? <div className="pds-split-modal__rail-footer">{railFooter}</div> : null}
        </aside>
      ) : null}
      <section className="pds-split-modal__main">
        <div className="pds-split-modal__tabbar">
          <Tabs
            items={tabItems}
            value={tab}
            onChange={onTabChange}
            variant="underline"
            size="small"
            bordered
            ariaLabel={tabsAriaLabel}
            className="pds-split-modal__tabs"
          />
          <div className="pds-split-modal__tabbar-side">
            {tabbarExtra}
            <button
              type="button"
              className="pds-split-modal__close"
              onClick={onClose}
              aria-label={closeLabel}
              title={closeLabel}
            >
              <CloseIcon size={15} />
            </button>
          </div>
        </div>
        <div className="pds-split-modal__scroll">
          {stats?.length ? (
            <section
              className="pds-split-modal__stats"
              style={{ gridTemplateColumns: `repeat(${statsColumns}, minmax(0, 1fr))` }}
            >
              {stats.map((stat, index) => (
                <div key={index}>
                  <span>
                    {stat.icon}
                    {stat.label}
                  </span>
                  <strong>{stat.value}</strong>
                  {stat.note != null ? <small>{stat.note}</small> : null}
                </div>
              ))}
            </section>
          ) : null}
          {children}
        </div>
      </section>
    </div>
  );
}

export function SplitModal<TabKey extends string>({
  open,
  ariaLabel,
  closeOnBackdrop,
  closeOnEscape,
  width = 'min(1180px, calc(100vw - 40px))',
  height = 'min(760px, calc(100dvh - 40px))',
  railWidth,
  rootClassName,
  className,
  dialogProps,
  ...layoutProps
}: SplitModalProps<TabKey>) {
  const style = {
    width,
    height,
    ...(railWidth === undefined
      ? null
      : {
          ['--pds-split-modal-rail-width' as string]:
            typeof railWidth === 'number' ? `${railWidth}px` : railWidth,
        }),
  } as CSSProperties;

  return (
    <Modal
      open={open}
      onClose={layoutProps.onClose}
      ariaLabel={ariaLabel}
      closeLabel={layoutProps.closeLabel}
      showCloseButton
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      className={cx('pds-split-modal-root', rootClassName)}
      contentClassName={cx('pds-split-modal', className)}
      style={style}
      dialogProps={dialogProps}
    >
      <SplitModalLayout {...layoutProps} />
    </Modal>
  );
}
