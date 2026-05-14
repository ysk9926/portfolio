import 'server-only';

import { createServerSupabaseClient } from '@/utils/supabase/server';
import {
  BlogCommentNode,
  BlogPostDetail,
  BlogPostStatus,
  BlogPostSummary,
} from './types';

interface PostRow {
  id: number;
  slug: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  body: string;
  status: BlogPostStatus;
  published_at: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
  blog_post_tags?: { tag: string }[];
  blog_comments?: { id: number }[];
}

const mapSummary = (row: PostRow): BlogPostSummary => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  thumbnail: row.thumbnail,
  status: row.status,
  publishedAt: row.published_at,
  viewCount: row.view_count,
  likeCount: row.like_count,
  tags: (row.blog_post_tags ?? []).map((t) => t.tag).sort(),
  commentCount: row.blog_comments?.length ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapDetail = (row: PostRow): BlogPostDetail => ({
  ...mapSummary(row),
  body: row.body,
});

export const listPublishedPosts = async (
  options: { tag?: string } = {},
): Promise<BlogPostSummary[]> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, summary, thumbnail, body, status, published_at, view_count, like_count, created_at, updated_at, blog_post_tags(tag), blog_comments(id)',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Failed to list posts: ${error.message}`);

  const rows = (data ?? []) as unknown as PostRow[];
  const mapped = rows.map(mapSummary);
  if (options.tag) {
    return mapped.filter((p) => p.tags.includes(options.tag!));
  }
  return mapped;
};

export const listAllPosts = async (): Promise<BlogPostSummary[]> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, summary, thumbnail, body, status, published_at, view_count, like_count, created_at, updated_at, blog_post_tags(tag), blog_comments(id)',
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list posts: ${error.message}`);
  return ((data ?? []) as unknown as PostRow[]).map(mapSummary);
};

export const getPostBySlug = async (
  slug: string,
  options: { allowDraft?: boolean } = {},
): Promise<BlogPostDetail | null> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      'id, slug, title, summary, thumbnail, body, status, published_at, view_count, like_count, created_at, updated_at, blog_post_tags(tag), blog_comments(id)',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load post: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as PostRow;
  if (row.status !== 'published' && !options.allowDraft) return null;
  return mapDetail(row);
};

export const listAllTags = async (): Promise<string[]> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blog_post_tags')
    .select('tag, post_id, blog_posts!inner(status)')
    .eq('blog_posts.status', 'published');

  if (error) throw new Error(`Failed to load tags: ${error.message}`);
  const tagSet = new Set<string>();
  for (const row of (data ?? []) as { tag: string }[]) {
    tagSet.add(row.tag);
  }
  return Array.from(tagSet).sort();
};

interface CommentRow {
  id: number;
  parent_id: number | null;
  nickname: string;
  body: string;
  like_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const listCommentsForPost = async (
  postId: number,
): Promise<BlogCommentNode[]> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('blog_comments')
    .select(
      'id, parent_id, nickname, body, like_count, is_deleted, created_at, updated_at',
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to load comments: ${error.message}`);

  const rows = ((data ?? []) as unknown as CommentRow[]).map<BlogCommentNode>(
    (row) => ({
      id: row.id,
      parentId: row.parent_id,
      nickname: row.is_deleted ? '삭제됨' : row.nickname,
      body: row.is_deleted ? '' : row.body,
      likeCount: row.like_count,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      replies: [],
    }),
  );

  const byId = new Map<number, BlogCommentNode>();
  rows.forEach((c) => byId.set(c.id, c));

  const roots: BlogCommentNode[] = [];
  rows.forEach((c) => {
    if (c.parentId == null) {
      roots.push(c);
    } else {
      const parent = byId.get(c.parentId);
      if (parent) parent.replies.push(c);
      else roots.push(c);
    }
  });

  return roots;
};
