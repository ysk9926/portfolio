// Navigation
export interface NavItem {
  label: string;
  href: string;
}

// About Me
export interface AboutItem {
  icon: string;
  label: string;
  value: string;
}

// Skills
export interface Skill {
  name: string;
  level: number;
  detail?: string;
}

export interface SkillCategory {
  category: string;
  color: string;
  skills: Skill[];
}

// Archiving
export interface ArchiveItem {
  title: string;
  description: string;
  url: string;
  details: string[];
}

// Activity heatmap
export interface ActivityProjectRef {
  name: string;
  count: number;
  track: '회사' | '개인';
}

export interface ActivityDay {
  date: string;
  weekday: string;
  inRange: boolean;
  companyCommitCount: number;
  personalCommitCount: number;
  companyProjects: ActivityProjectRef[];
  personalProjects: ActivityProjectRef[];
  totalCommitCount: number;
  intensityLevel: number;
  companyIntensityLevel: number;
  personalIntensityLevel: number;
  hasActivity: boolean;
}

export interface ActivityWeek {
  weekStart: string;
  days: ActivityDay[];
}

export interface ActivityHeatmapSummary {
  activeDays: number;
  companyActiveDays: number;
  personalActiveDays: number;
  totalCompanyCommits: number;
  totalPersonalCommits: number;
  totalCommits: number;
  latestActiveDate: string | null;
}

export interface ActivityHeatmap {
  generatedAt: string;
  rangeStart: string;
  rangeEnd: string;
  summary: ActivityHeatmapSummary;
  weeks: ActivityWeek[];
}

export interface ProjectPortfolioSyncEntry {
  projectKey: string;
  projectTitle: string;
  sourceDoc: string;
  sourceDocRelative: string;
  headline: string;
  summary: string;
  status: string;
  period: string;
  company: string;
  role: string;
  teamSize: string;
  updated: string;
  tech: string[];
  track: string;
  todayCommitCount: number;
  lastAuthoredCommitAt: string;
  linkedRepos: string[];
  recentUpdates: string;
  portfolioNotes: string;
  thumbnail: string;
  screenshots: string[];
  screenshotCount: number;
}

export interface ProjectPortfolioSync {
  generatedAt: string;
  projects: ProjectPortfolioSyncEntry[];
}

// Project STAR structure
export interface ProjectStar {
  summary: string;
  role: string;
  background: string;
  solutions: string;
  results: string;
  troubleshooting?: string;
}

// Projects
export interface Project {
  id: number;
  title: string;
  period: string;
  description: string;
  features: string[];
  techStack: string[];
  deployUrl?: string;
  githubUrl?: string;
  isMain: boolean;
  thumbnail: string;
  screenshots: string[];
  shortDescription?: string;
  star?: ProjectStar;
  portfolioSync?: ProjectPortfolioSyncEntry;
}

// Career
export interface CareerEntry {
  company: string;
  role: string;
  period: string;
  description: string;
  achievements: string[];
}
