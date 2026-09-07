export const PROJECT_IMAGE_ORIGIN =
  'https://portfolio-project-images-167217328107.s3.ap-northeast-2.amazonaws.com';

/** Keep legacy paths compatible with the portfolio sync feed and admin editor. */
export const projectImageUrl = (path: string): string =>
  path.startsWith('/images/projects/') ? `${PROJECT_IMAGE_ORIGIN}${path}` : path;
