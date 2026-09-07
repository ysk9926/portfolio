export type TechCategoryKey =
  | 'frontend'
  | 'backend'
  | 'data'
  | 'infra'
  | 'mobile'
  | 'ai'
  | 'lang';

export interface TechCategory {
  key: TechCategoryKey;
  label: string;
  /** Tailwind class for the small category dot. */
  dot: string;
}

export const TECH_CATEGORIES: Record<TechCategoryKey, TechCategory> = {
  frontend: {
    key: 'frontend',
    label: '프론트엔드',
    dot: 'bg-sky-500',
  },
  backend: {
    key: 'backend',
    label: '백엔드',
    dot: 'bg-violet-500',
  },
  data: {
    key: 'data',
    label: '데이터',
    dot: 'bg-emerald-500',
  },
  infra: {
    key: 'infra',
    label: '인프라',
    dot: 'bg-amber-500',
  },
  mobile: {
    key: 'mobile',
    label: '모바일',
    dot: 'bg-rose-500',
  },
  ai: {
    key: 'ai',
    label: 'AI·외부 API',
    dot: 'bg-cyan-500',
  },
  lang: {
    key: 'lang',
    label: '언어·도구',
    dot: 'bg-slate-500',
  },
};

const RULES: Array<[TechCategoryKey, RegExp]> = [
  // Mobile before frontend so "React Native" and "Flutter WebView" land here.
  ['mobile', /react native|flutter|dart|swift|swiftui|kotlin|android|ios|expo|webview/],
  ['ai', /openai|gpt|claude|anthropic|gemini|llm|langchain|ocr|tesseract|whisper|popbill|kakao|naver|toss|iamport|portone|카페24|cafe24|ecount|api/],
  ['infra', /aws|ec2|ecs|fargate|s3|rds|lambda|cloudfront|docker|kubernetes|k8s|vercel|nginx|github actions|ci\/cd|cloudflare|terraform|pm2|linux|ubuntu|launchagent/],
  ['data', /postgres|mysql|mariadb|sqlite|mongo|redis|supabase|firebase|elasticsearch|dynamo|sql server|mssql|bigquery|clickhouse/],
  ['backend', /node|express|nest|fastapi|django|flask|spring|prisma|drizzle|typeorm|graphql|trpc|socket\.io|socket|better-auth|next-auth|auth|jwt|celery|grpc|rest|websocket|zod|server actions/],
  ['frontend', /react|next|nuxt|vue|svelte|angular|tailwind|css|html|vite|webpack|zustand|tanstack|query|redux|framer|storybook|shadcn|radix|mermaid|shiki|markdown|playwright|jest|vitest|cypress/],
  ['lang', /typescript|javascript|python|java|go|rust|c#|c\+\+|php|ruby|bash|zsh|shell/],
];

export function classifyTech(name: string): TechCategory {
  const needle = name.toLowerCase();
  for (const [key, pattern] of RULES) {
    if (pattern.test(needle)) return TECH_CATEGORIES[key];
  }
  return TECH_CATEGORIES.lang;
}
