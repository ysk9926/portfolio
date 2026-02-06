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
}

// Career
export interface CareerEntry {
  company: string;
  role: string;
  period: string;
  description: string;
  achievements: string[];
}
