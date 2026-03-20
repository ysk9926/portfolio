'use client';

import { useMemo, useState } from 'react';
import activityHeatmapData from '../../data/activity-heatmap.json';
import {
  ActivityDay,
  ActivityHeatmap as ActivityHeatmapType,
  ActivityProjectRef,
} from '@/lib/types';
import SectionWrapper from '../ui/SectionWrapper';
import AnimateOnScroll from '../ui/AnimateOnScroll';

const heatmap = activityHeatmapData as ActivityHeatmapType;
const weekdayRows = ['Mon', 'Wed', 'Fri'];

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

function MonthLabels() {
  return (
    <div className="flex gap-1 mb-2 pl-10">
      {heatmap.weeks.map((week, index) => {
        const firstVisibleDay = week.days.find((day) => day.inRange);
        if (!firstVisibleDay) {
          return <div key={week.weekStart} className="w-4" />;
        }

        const monthKey = firstVisibleDay.date.slice(0, 7);
        const previousVisibleDay = [...heatmap.weeks.slice(0, index)]
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
            className="w-4 text-[10px] leading-none text-neutral-400"
          >
            {label}
          </div>
        );
      })}
    </div>
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
  const initialDay =
    flatDays.find((day) => day.date === heatmap.summary.latestActiveDate) ??
    [...flatDays].reverse().find((day) => day.inRange) ??
    flatDays[0];
  const [activeDate, setActiveDate] = useState(initialDay?.date ?? '');

  const activeDay =
    flatDays.find((day) => day.date === activeDate) ??
    initialDay;

  return (
    <SectionWrapper
      id="activity"
      title="Activity"
      className="bg-white"
      contentVisibility
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
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

          <div className="rounded-[28px] border border-neutral-200 bg-neutral-950 px-5 py-6 text-white md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-neutral-500">
                  Portfolio Activity
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
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

            <div className="mt-6 overflow-x-auto pb-2">
              <div className="min-w-[900px]">
                <MonthLabels />
                <div className="flex gap-3">
                  <div className="mt-5 flex flex-col gap-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                      <div
                        key={label}
                        className="flex h-4 items-center justify-end pr-1"
                      >
                        {weekdayRows.includes(label) ? label : ''}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1">
                    {heatmap.weeks.map((week) => (
                      <div key={week.weekStart} className="flex flex-col gap-1">
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
                              onMouseEnter={() => setActiveDate(day.date)}
                              onFocus={() => setActiveDate(day.date)}
                              onClick={() => setActiveDate(day.date)}
                              className={`group relative h-4 w-4 rounded-[4px] border transition-transform cursor-pointer ${
                                day.inRange
                                  ? 'border-white/10 hover:scale-110 focus:scale-110'
                                  : 'border-transparent opacity-30'
                              } ${isActive ? 'ring-2 ring-white/70 ring-offset-2 ring-offset-neutral-950' : ''}`}
                            >
                              <span className="sr-only">{buildAriaLabel(day)}</span>
                              <span className="absolute inset-0 rounded-[4px] bg-[var(--color-heatmap-empty)]" />
                              {day.companyCommitCount > 0 && (
                                <span
                                  className={`absolute inset-0 rounded-[4px] ${
                                    hasBothTracks ? 'heatmap-company-slice' : ''
                                  }`}
                                  style={{
                                    backgroundColor: levelColor(day.companyIntensityLevel, 'company'),
                                  }}
                                />
                              )}
                              {day.personalCommitCount > 0 && (
                                <span
                                  className={`absolute inset-0 rounded-[4px] ${
                                    hasBothTracks ? 'heatmap-personal-slice' : ''
                                  }`}
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
