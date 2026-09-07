export async function analyticsFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  if (response.status === 401) {
    window.location.assign("/admin/login");
    throw new Error("다시 로그인해 주세요.");
  }
  if (!response.ok)
    throw new Error(
      response.status === 403
        ? "접근 권한이 없습니다."
        : response.status === 400
          ? "입력한 날짜와 항목을 확인해 주세요."
          : "데이터를 불러오지 못했습니다. 다시 시도해 주세요.",
    );
  return response.status === 204 ? (undefined as T) : response.json();
}
export const duration = (ms: number) =>
  ms < 60000
    ? `${Math.round(ms / 1000)}초`
    : `${Math.floor(ms / 60000)}분 ${Math.round((ms % 60000) / 1000)}초`;
export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
export const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm";
export const buttonClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-100 disabled:opacity-40";
