export const isIndexableTagPage = (postCount: number): boolean => postCount >= 2;

export const latestKnownDate = (
  values: Array<Date | string | null | undefined>,
): Date | undefined => {
  let latest: Date | undefined;

  for (const value of values) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) continue;
    if (!latest || date > latest) latest = date;
  }

  return latest;
};
