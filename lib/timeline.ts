import { Project } from './types';

export interface ParsedPeriod {
  startYear: number;
  startMonth: number; // 1-12
  endYear: number;
  endMonth: number;
  isOngoing: boolean;
}

export interface TimelineMonth {
  year: number;
  month: number;
  label: string; // "5월", "6월" ...
}

export function parsePeriod(period: string): ParsedPeriod {
  const separator = period.includes('~') ? '~' : period.includes('-') ? '-' : null;
  const startPart = separator ? period.split(separator)[0].trim() : period.trim();
  const endPart = separator ? period.split(separator)[1]?.trim() : undefined;

  const [startYear, startMonth] = startPart.split('.').map(Number);

  const isOngoing = endPart === '현재' || endPart === '진행중';
  let endYear: number;
  let endMonth: number;

  if (!endPart || isOngoing) {
    const now = new Date();
    endYear = isOngoing ? now.getFullYear() : startYear;
    endMonth = isOngoing ? now.getMonth() + 1 : startMonth;
  } else {
    [endYear, endMonth] = endPart.split('.').map(Number);
  }

  return { startYear, startMonth, endYear, endMonth, isOngoing };
}

export function generateTimelineMonths(projects: Project[]): TimelineMonth[] {
  let minYear = Infinity;
  let minMonth = Infinity;
  let maxYear = -Infinity;
  let maxMonth = -Infinity;

  for (const project of projects) {
    const parsed = parsePeriod(project.period);
    if (
      parsed.startYear < minYear ||
      (parsed.startYear === minYear && parsed.startMonth < minMonth)
    ) {
      minYear = parsed.startYear;
      minMonth = parsed.startMonth;
    }
    if (
      parsed.endYear > maxYear ||
      (parsed.endYear === maxYear && parsed.endMonth > maxMonth)
    ) {
      maxYear = parsed.endYear;
      maxMonth = parsed.endMonth;
    }
  }

  const months: TimelineMonth[] = [];
  let y = minYear;
  let m = minMonth;

  while (y < maxYear || (y === maxYear && m <= maxMonth)) {
    months.push({ year: y, month: m, label: `${m}월` });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

  return months;
}

export function getProjectSpan(
  period: string,
  months: TimelineMonth[],
): { startIndex: number; spanCount: number } {
  const parsed = parsePeriod(period);

  const startIndex = months.findIndex(
    (m) => m.year === parsed.startYear && m.month === parsed.startMonth,
  );
  const endIndex = months.findIndex(
    (m) => m.year === parsed.endYear && m.month === parsed.endMonth,
  );

  const safeStart = Math.max(0, startIndex);
  const safeEnd = endIndex === -1 ? months.length - 1 : endIndex;

  return {
    startIndex: safeStart,
    spanCount: safeEnd - safeStart + 1,
  };
}

export function sortProjectsByStartDate(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const pa = parsePeriod(a.period);
    const pb = parsePeriod(b.period);
    if (pa.startYear !== pb.startYear) return pa.startYear - pb.startYear;
    return pa.startMonth - pb.startMonth;
  });
}
