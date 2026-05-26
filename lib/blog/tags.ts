export const slugifyTag = (tag: string): string => {
  const slug = tag
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'tag';
};

export const tagPath = (tag: string): string =>
  `/blog/tags/${encodeURIComponent(slugifyTag(tag))}`;

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const findTagBySlug = (
  tags: string[],
  rawSlug: string,
): string | undefined => {
  const decodedSlug = safeDecodeURIComponent(rawSlug);
  return tags.find((tag) => slugifyTag(tag) === decodedSlug);
};

export const describeTag = (tag: string, postCount: number): string =>
  `${tag} 태그로 정리한 개발 기록 ${postCount.toLocaleString('ko-KR')}개를 모았습니다. 실제 프로젝트에서 마주한 문제, 구현 과정, 운영 경험을 중심으로 정리합니다.`;
