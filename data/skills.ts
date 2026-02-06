import { SkillCategory } from '../lib/types';

export const skillsData: SkillCategory[] = [
  {
    category: 'Frontend',
    skills: [
      { name: 'React' },
      { name: 'Next.js' },
      { name: 'TypeScript' },
      { name: 'JavaScript' },
      { name: 'HTML' },
      { name: 'CSS' },
      { name: 'Tailwind CSS' }
    ]
  },
  {
    category: 'Backend',
    skills: [
      { name: 'Node.js' },
      { name: 'Express' },
      { name: 'Java' },
      { name: 'Spring Boot' }
    ]
  },
  {
    category: 'Database',
    skills: [
      { name: 'MySQL' },
      { name: 'MongoDB' },
      { name: 'PostgreSQL' }
    ]
  },
  {
    category: 'DevOps & Tools',
    skills: [
      { name: 'Git' },
      { name: 'GitHub' },
      { name: 'Docker' },
      { name: 'AWS' },
      { name: 'Figma' }
    ]
  }
];
