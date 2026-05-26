import BlogPostCard from '@/components/blog/BlogPostCard';
import type { BlogPostSummary } from '@/lib/blog/types';

interface BlogPostListProps {
  posts: BlogPostSummary[];
}

export default function BlogPostList({ posts }: BlogPostListProps) {
  return (
    <ul className="space-y-6">
      {posts.map((post) => (
        <li key={post.id}>
          <BlogPostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
