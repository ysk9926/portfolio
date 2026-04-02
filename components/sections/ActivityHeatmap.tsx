'use client';

import { useMemo, useState, useEffect } from 'react';
import activityHeatmapData from '../../data/activity-heatmap.json';
import {
  ActivityDay,
  ActivityHeatmap as ActivityHeatmapType,
  ActivityProjectRef,
  ActivityWeek,
} from '@/lib/types';
import SectionWrapper from '../ui/SectionWrapper';
import AnimateOnScroll from '../ui/AnimateOnScroll';

const heatmap = activityHeatmapData as ActivityHeatmapType;
const weekdayRows = ['Mon', 'Wed', 'Fri'];
const allWeekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MOBILE_WEEKS_PER_PAGE = 14;

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function buildAriaLabel(day: ActivityDay) {
  const parts = [formatDateLabel(day.date)];

  if (!day.inRange) {
    parts.push('표시 범위 밖 날짜');
  } else if (!day.hasActivity) {
    parts.push('활동 없음');
  } else {
    parts.push(`회사 커밋 ${day.companyCommitCount}개`);
    parts.push(`개인 커밋 ${day.personalCommitCount}개`);
  }

  return parts.join(', ');
}

function levelColor(level: number, track: 'company' | 'personal') {
  if (level <= 0) {
    return 'transparent';
  }

  const prefix = track === 'company' ? 'company' : 'personal';
  return `var(--color-heatmap-${prefix}-${level})`;
}

function formatMonthRange(weeks: ActivityWeek[]) {
  const visibleDays = weeks.flatMap((week) => week.days).filter((day) => day.inRange);
  if (!visibleDays.length) {
    return '';
  }

  const first = visibleDays[0];
  const last = visibleDays[visibleDays.length - 1];
  return `${Number(first.date.slice(5, 7))}월 - ${Number(last.date.slice(5, 7))}월`;
}

function MonthLabels({
  weeks,
  compact = false,
}: {
  weeks: ActivityWeek[];
  compact?: boolean;
}) {
  return (
    <div
      className={`mb-2 flex ${compact ? 'gap-0.5 pl-6' : 'gap-0.5 pl-7 sm:gap-1 sm:pl-10'}`}
    >
      {weeks.map((week, index) => {
        const firstVisibleDay = week.days.find((day) => day.inRange);
        if (!firstVisibleDay) {
          return <div key={week.weekStart} className={compact ? 'w-3' : 'w-3 sm:w-4'} />;
        }

        const monthKey = firstVisibleDay.date.slice(0, 7);
        const previousVisibleDay = [...weeks.slice(0, index)]
          .reverse()
          .map((previousWeek) => previousWeek.days.find((day) => day.inRange))
          .find(Boolean);
        const label =
          !previousVisibleDay || previousVisibleDay.date.slice(0, 7) !== monthKey
            ? `${Number(firstVisibleDay.date.slice(5, 7))}월`
            : '';

        return (
          <div
            key={week.weekStart}
            className={
              compact
                ? 'w-3 text-[9px] leading-none text-neutral-400'
                : 'w-3 text-[9px] leading-none text-neutral-400 sm:w-4 sm:text-[10px]'
            }
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

function HeatmapGrid({
  weeks,
  activeDay,
  onSelectDay,
  compact = false,
}: {
  weeks: ActivityWeek[];
  activeDay?: ActivityDay;
  onSelectDay: (day: ActivityDay) => void;
  compact?: boolean;
}) {
  const axisClasses = compact
    ? 'mt-4 flex flex-col gap-0.5 pr-1 text-[9px] uppercase tracking-[0.14em] text-neutral-500'
    : 'mt-4 flex flex-col gap-0.5 pr-1 text-[9px] uppercase tracking-[0.14em] text-neutral-500 sm:mt-5 sm:gap-1 sm:pr-0 sm:text-[10px] sm:tracking-[0.16em]';
  const axisCellClasses = compact
    ? 'flex h-3 items-center justify-end'
    : 'flex h-3 items-center justify-end sm:h-4 sm:pr-1';
  const columnGapClasses = compact ? 'flex gap-0.5' : 'flex gap-0.5 sm:gap-1';
  const weekClasses = compact ? 'flex flex-col gap-0.5' : 'flex flex-col gap-0.5 sm:gap-1';
  const buttonBaseClasses = compact
    ? 'group relative h-3 w-3 touch-manipulation rounded-[3px] border transition-transform cursor-pointer'
    : 'group relative h-3 w-3 touch-manipulation rounded-[3px] border transition-transform sm:h-4 sm:w-4 sm:rounded-[4px] cursor-pointer';
  const emptyClasses = compact
    ? 'absolute inset-0 rounded-[3px] bg-[var(--color-heatmap-empty)]'
    : 'absolute inset-0 rounded-[3px] bg-[var(--color-heatmap-empty)] sm:rounded-[4px]';
  const fillClasses = compact
    ? 'absolute inset-0 rounded-[3px]'
    : 'absolute inset-0 rounded-[3px] sm:rounded-[4px]';

  return (
    <>
      <MonthLabels weeks={weeks} compact={compact} />
      <div className={`flex ${compact ? 'gap-2' : 'gap-2 sm:gap-3'}`}>
        <div className={axisClasses}>
          {allWeekdayLabels.map((label) => (
            <div key={label} className={axisCellClasses}>
              {weekdayRows.includes(label) ? label : ''}
            </div>
          ))}
        </div>

        <div className={columnGapClasses}>
          {weeks.map((week) => (
            <div key={week.weekStart} className={weekClasses}>
              {week.days.map((day) => {
                const isActive = activeDay?.date === day.date;
                const hasBothTracks =
                  day.companyCommitCount > 0 && day.personalCommitCount > 0;

                return (
                  <button
                    key={day.date}
                    type="button"
                    aria-label={buildAriaLabel(day)}
                    title={buildAriaLabel(day)}
                    onMouseEnter={() => onSelectDay(day)}
                    onFocus={() => onSelectDay(day)}
                    onClick={() => onSelectDay(day)}
                    className={`${buttonBaseClasses} ${
                      day.inRange
                        ? 'border-white/10 hover:scale-110 focus:scale-110'
                        : 'border-transparent opacity-30'
                    } ${isActive ? 'ring-2 ring-white/70 ring-offset-1 ring-offset-neutral-950 sm:ring-offset-2' : ''}`}
                  >
                    <span className="sr-only">{buildAriaLabel(day)}</span>
                    <span className={emptyClasses} />
                    {day.companyCommitCount > 0 && (
                      <span
                        className={`${fillClasses} ${hasBothTracks ? 'heatmap-company-slice' : ''}`}
                        style={{
                          backgroundColor: levelColor(day.companyIntensityLevel, 'company'),
                        }}
                      />
                    )}
                    {day.personalCommitCount > 0 && (
                      <span
                        className={`${fillClasses} ${hasBothTracks ? 'heatmap-personal-slice' : ''}`}
                        style={{
                          backgroundColor: levelColor(day.personalIntensityLevel, 'personal'),
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ActivityList({
  title,
  projects,
  emptyLabel,
  accentClass,
}: {
  title: string;
  projects: ActivityProjectRef[];
  emptyLabel: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-2.5 w-2.5 rounded-full ${accentClass}`} />
        <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
      </div>
      {projects.length ? (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li
              key={`${project.track}-${project.name}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-neutral-700">{project.name}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                {project.count}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-400">{emptyLabel}</p>
      )}
    </div>
  );
}

export default function ActivityHeatmap() {
  const flatDays = useMemo(
    () => heatmap.weeks.flatMap((week) => week.days).filter((day) => day.inRange),
    []
  );
  const mobileWeekPages = useMemo(() => {
    const pages: ActivityWeek[][] = [];
    for (let index = 0; index < heatmap.weeks.length; index += MOBILE_WEEKS_PER_PAGE) {
      pages.push(heatmap.weeks.slice(index, index + MOBILE_WEEKS_PER_PAGE));
    }
    return pages;
  }, []);
  const initialDay =
    flatDays.find((day) => day.date === heatmap.summary.latestActiveDate) ??
    [...flatDays].reverse().find((day) => day.inRange) ??
    flatDays[0];
  const initialWeekIndex = heatmap.weeks.findIndex((week) =>
    week.days.some((day) => day.date === initialDay?.date)
  );
  const initialMobilePageIndex =
    initialWeekIndex >= 0
      ? Math.floor(initialWeekIndex / MOBILE_WEEKS_PER_PAGE)
      : Math.max(mobileWeekPages.length - 1, 0);
  const [activeDate, setActiveDate] = useState(initialDay?.date ?? '');
  const [mobilePageIndex, setMobilePageIndex] = useState(initialMobilePageIndex);

  const activeDay =
    flatDays.find((day) => day.date === activeDate) ??
    initialDay;

  const mobileWeeks = mobileWeekPages[mobilePageIndex] ?? mobileWeekPages[0] ?? [];

  const handleSelectDay = (day: ActivityDay) => {
    setActiveDate(day.date);
    const selectedWeekIndex = heatmap.weeks.findIndex((week) =>
      week.days.some((item) => item.date === day.date)
    );
    if (selectedWeekIndex >= 0) {
      setMobilePageIndex(Math.floor(selectedWeekIndex / MOBILE_WEEKS_PER_PAGE));
    }
  };

  return (
    <SectionWrapper
      id="activity"
      title="Activity"
      className="bg-white"
      contentVisibility
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <AnimateOnScroll className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
                Active Days
              </p>
              <p className="mt-3 text-3xl font-bold text-neutral-950">
                {heatmap.summary.activeDays}
              </p>
              <p className="mt-2 text-sm text-neutral-500">최근 1년 기준 활동한 날짜</p>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
                Company
              </p>
              <p className="mt-3 text-3xl font-bold text-amber-950">
                {heatmap.summary.totalCompanyCommits}
              </p>
              <p className="mt-2 text-sm text-amber-700/80">회사 프로젝트 authored commits</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                Personal
              </p>
              <p className="mt-3 text-3xl font-bold text-emerald-950">
                {heatmap.summary.totalPersonalCommits}
              </p>
              <p className="mt-2 text-sm text-emerald-700/80">개인 프로젝트 authored commits</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-neutral-950 px-4 py-5 text-white sm:px-5 sm:py-6 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-neutral-500 sm:text-sm sm:tracking-[0.24em]">
                  Portfolio Activity
                </p>
                <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                  GitHub 잔디처럼 보는 1년 작업 흐름
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-heatmap-company-4)]" />
                  회사
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-heatmap-personal-4)]" />
                  개인
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-[4px] border border-white/15 bg-[linear-gradient(135deg,var(--color-heatmap-company-3)_0%,var(--color-heatmap-company-3)_50%,var(--color-heatmap-personal-3)_50%,var(--color-heatmap-personal-3)_100%)]" />
                  동시 활동
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setMobilePageIndex((current) => Math.max(current - 1, 0))}
                  disabled={mobilePageIndex === 0}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-neutral-200 transition disabled:opacity-30"
                >
                  이전
                </button>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                    {mobilePageIndex + 1} / {mobileWeekPages.length}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatMonthRange(mobileWeeks)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setMobilePageIndex((current) =>
                      Math.min(current + 1, mobileWeekPages.length - 1)
                    )
                  }
                  disabled={mobilePageIndex === mobileWeekPages.length - 1}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-neutral-200 transition disabled:opacity-30"
                >
                  다음
                </button>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <HeatmapGrid
                  weeks={mobileWeeks}
                  activeDay={activeDay}
                  onSelectDay={handleSelectDay}
                  compact
                />
              </div>
            </div>

            <div className="-mx-4 mt-5 hidden overflow-x-auto px-4 pb-2 md:block md:mx-0 md:mt-6 md:px-0">
              <div className="min-w-max">
                <HeatmapGrid
                  weeks={heatmap.weeks}
                  activeDay={activeDay}
                  onSelectDay={handleSelectDay}
                />
              </div>
            </div>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 md:p-6">
            {activeDay ? (
              <>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                  Selected Day
                </p>
                <h3 className="mt-2 text-xl font-semibold text-neutral-950">
                  {formatDateLabel(activeDay.date)}
                </h3>
                <p className="mt-3 text-sm text-neutral-500">
                  총 {activeDay.totalCommitCount}개 commit, 회사 {activeDay.companyCommitCount}개,
                  개인 {activeDay.personalCommitCount}개
                </p>

                <div className="mt-5 space-y-4">
                  <ActivityList
                    title="회사 프로젝트"
                    projects={activeDay.companyProjects}
                    emptyLabel="회사 프로젝트 활동 없음"
                    accentClass="bg-[var(--color-heatmap-company-4)]"
                  />
                  <ActivityList
                    title="개인 프로젝트"
                    projects={activeDay.personalProjects}
                    emptyLabel="개인 프로젝트 활동 없음"
                    accentClass="bg-[var(--color-heatmap-personal-4)]"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500">활동 데이터가 없습니다.</p>
            )}
          </div>
        </AnimateOnScroll>
      </div>
    </SectionWrapper>
  );
}
