export const PROFILE_HANDLE = 'ysk9926';

export const PROFILE_SAME_AS = [
  'https://github.com/ysk9926',
  'https://velog.io/@ysk9926',
  'https://www.youtube.com/@ysk9926',
];

export const withProfileHandle = (value: string): string => {
  if (value.includes(PROFILE_HANDLE)) return value;
  return `${value} | ${PROFILE_HANDLE}`;
};

export const withProfileHandleDescription = (value: string): string => {
  if (value.includes(PROFILE_HANDLE)) return value;
  return `${value} ysk9926 활동명으로도 찾을 수 있습니다.`;
};
