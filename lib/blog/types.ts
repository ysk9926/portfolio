import { z } from 'zod';

export const blogPostStatusSchema = z.enum(['draft', 'published']);
export type BlogPostStatus = z.infer<typeof blogPostStatusSchema>;

export const blogPostInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
      message: 'slug must be lowercase letters, numbers, hyphens',
    }),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  thumbnail: z.string().max(1000).nullable().optional(),
  body: z.string().min(1),
  status: blogPostStatusSchema,
  publishedAt: z.string().datetime().nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20),
});
export type BlogPostInput = z.infer<typeof blogPostInputSchema>;

export interface BlogPostSummary {
  id: number;
  slug: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  tags: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  body: string;
}

export interface BlogCommentNode {
  id: number;
  parentId: number | null;
  nickname: string;
  body: string;
  likeCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies: BlogCommentNode[];
}

export const commentCreateSchema = z.object({
  parentId: z.number().int().nullable().optional(),
  nickname: z.string().min(1).max(50),
  password: z.string().min(4).max(50),
  body: z.string().min(1).max(5000),
});

export const commentUpdateSchema = z.object({
  password: z.string().min(4).max(50),
  body: z.string().min(1).max(5000),
});

export const commentDeleteSchema = z.object({
  password: z.string().min(4).max(50).optional(),
});

export const likeToggleSchema = z.object({
  delta: z.union([z.literal(1), z.literal(-1)]),
});
