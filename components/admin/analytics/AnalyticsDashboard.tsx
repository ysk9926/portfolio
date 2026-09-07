"use client";
import { useEffect, useState } from "react";
import type { DashboardData, TrackingLink } from "@/lib/analytics/types";
import {
  analyticsFetch,
  buttonClass,
  dateTime,
  duration,
  inputClass,
} from "./http";
import TrackingLinks from "./TrackingLinks";
import SessionDetail from "./SessionDetail";
const day = (offset = 0) =>
  new Date(Date.now() + 9 * 3600000 + offset * 86400000)
    .toISOString()
    .slice(0, 10);
export default function AnalyticsDashboard({
  initialSearch = {},
}: {
  initialSearch?: Record<string, string | string[] | undefined>;
}) {
  const initial = (key: string) =>
    typeof initialSearch[key] === "string"
      ? (initialSearch[key] as string)
      : "";
  const [tab, setTab] = useState<"visits" | "links">("visits");
  const [from, setFrom] = useState(() => initial("from") || day(-6));
  const [to, setTo] = useState(() => initial("to") || day());
  const [link, setLink] = useState(() => initial("linkId"));
  const [device, setDevice] = useState(() => initial("device"));
  const [bots, setBots] = useState(
    () => initial("includeSuspectedBots") === "true",
  );
  const [test, setTest] = useState(() => initial("includeTest") === "true");
  const [data, setData] = useState<DashboardData | null>(null);
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [cursor, setCursor] = useState("");
  useEffect(() => {
    let active = true;
    analyticsFetch<{ links: TrackingLink[] }>("/api/admin/analytics/links")
      .then((d) => {
        if (active) setLinks(d.links);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tab]);
  useEffect(() => {
    if (tab !== "visits") return;
    const controller = new AbortController();
    const p = new URLSearchParams({
      from,
      to,
      includeSuspectedBots: String(bots),
      includeTest: String(test),
    });
    if (link) p.set("linkId", link);
    if (device) p.set("device", device);
    window.history.replaceState(null, "", "?" + p);
    if (cursor) p.set("cursor", cursor);
    analyticsFetch<DashboardData>("/api/admin/analytics?" + p, {
      signal: controller.signal,
    })
      .then((next) => {
        setData(next);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [from, to, link, device, bots, test, cursor, reload, tab]);
  const reset = () => {
    setCursor("");
    setLoading(true);
    setError("");
  };
  return (
    <>
      <div
        role="tablist"
        aria-label="방문 분석 메뉴"
        className="mb-6 flex gap-2"
      >
        {[
          ["visits", "방문 기록"],
          ["links", "제출 링크"],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={`rounded-lg px-5 py-2 text-sm font-medium ${tab === key ? "bg-neutral-900 text-white" : "border bg-white"}`}
            onClick={() => setTab(key as "visits" | "links")}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "links" ? (
        <TrackingLinks />
      ) : (
        <>
          <p className="mb-4 text-sm leading-6 text-neutral-500">
            기업에 보낸 링크의 방문을 확인할 수 있습니다. 링크 공유·자동
            미리보기 때문에 특정 담당자의 열람을 확정할 수는 없습니다. 기록
            없음은 미열람을 뜻하지 않습니다.
          </p>
          <div className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-neutral-500">
                시작일
                <input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    reset();
                  }}
                  className={inputClass + " mt-1"}
                />
              </label>
              <label className="text-xs text-neutral-500">
                종료일
                <input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    reset();
                  }}
                  className={inputClass + " mt-1"}
                />
              </label>
              <div className="flex gap-1">
                {[1, 7, 30].map((n) => (
                  <button
                    key={n}
                    className={buttonClass}
                    onClick={() => {
                      setFrom(day(1 - n));
                      setTo(day());
                      reset();
                    }}
                  >
                    {n === 1 ? "오늘" : `${n}일`}
                  </button>
                ))}
              </div>
              <label className="min-w-36 text-xs text-neutral-500">
                제출 링크
                <select
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    reset();
                  }}
                  className={inputClass + " mt-1"}
                >
                  <option value="">전체</option>
                  {links.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.companyLabel} · {l.position}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-neutral-500">
                기기
                <select
                  value={device}
                  onChange={(e) => {
                    setDevice(e.target.value);
                    reset();
                  }}
                  className={inputClass + " mt-1"}
                >
                  <option value="">전체</option>
                  <option value="desktop">데스크톱</option>
                  <option value="mobile">모바일</option>
                  <option value="tablet">태블릿</option>
                  <option value="unknown">미확인</option>
                </select>
              </label>
              <button
                className={buttonClass}
                onClick={() => {
                  setLoading(true);
                  setReload((v) => v + 1);
                }}
              >
                새로고침
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-neutral-500">
              <label>
                <input
                  type="checkbox"
                  checked={bots}
                  onChange={(e) => {
                    setBots(e.target.checked);
                    reset();
                  }}
                />{" "}
                자동화 의심 포함
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={test}
                  onChange={(e) => {
                    setTest(e.target.checked);
                    reset();
                  }}
                />{" "}
                테스트 방문 포함
              </label>
              <span>방문 시작일 기준 · 한국 시간 · 최대 90일</span>
            </div>
          </div>
          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-white p-5 text-red-700"
            >
              {error}
              <button
                className={buttonClass + " ml-3"}
                onClick={() => {
                  setLoading(true);
                  setReload((v) => v + 1);
                }}
              >
                다시 시도
              </button>
            </div>
          ) : loading ? (
            <p
              role="status"
              className="py-12 text-center text-sm text-neutral-500"
            >
              방문 기록을 불러오는 중…
            </p>
          ) : (
            data && (
              <>
                <div className="my-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    ["방문 세션", data.summary.sessions.toLocaleString()],
                    [
                      "브라우저 수 (추정)",
                      data.summary.browsers.toLocaleString(),
                    ],
                    [
                      "활동 관측 방문",
                      data.summary.observedSessions.toLocaleString(),
                    ],
                    ["활성 시간 중앙값", duration(data.summary.medianActiveMs)],
                  ].map(([label, value]) => (
                    <div className="rounded-xl border bg-white p-5" key={label}>
                      <p className="text-xs text-neutral-500">{label}</p>
                      <p className="mt-2 text-2xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                {data.links.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {data.links.map((l) => (
                      <button
                        key={l.linkId ?? "unknown"}
                        className="rounded-lg border bg-white px-3 py-2 text-xs"
                        onClick={() => {
                          setLink(l.linkId ?? "");
                          reset();
                        }}
                      >
                        {l.companyLabel ?? "출처 미확인"} · {l.sessions}회 /
                        활동 {l.observedSessions}회
                      </button>
                    ))}
                  </div>
                )}
                <section aria-labelledby="project-analytics-title" className="mb-5 overflow-hidden rounded-xl border bg-white">
                  <div className="border-b px-5 py-4">
                    <h2 id="project-analytics-title" className="font-semibold">프로젝트별 관심도</h2>
                    <p className="mt-2 text-xs leading-5 text-neutral-500">
                      열람한 방문 수가 많은 순서입니다. 같은 방문에서 여러 번 열어도 방문 수는 1회이며, 모달·상세 열람 횟수는 각각 누적합니다. 체류 시간은 화면 노출과 최근 활동을 기준으로 계산합니다.
                    </p>
                  </div>
                  {!data.projects.length ? (
                    <p className="px-5 py-8 text-center text-sm text-neutral-500">선택한 조건에 프로젝트 열람·클릭 기록이 없습니다.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 text-xs text-neutral-500">
                          <tr>{["프로젝트", "열람 방문", "모달 열람", "상세 페이지", "활성 시간 합계", "방문당 활성", "GitHub 클릭", "데모 클릭"].map(label => <th key={label} className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}</tr>
                        </thead>
                        <tbody>
                          {data.projects.map(project => (
                            <tr key={project.projectId} className="border-t">
                              <td className="min-w-48 px-4 py-4 font-medium">{project.title}</td>
                              <td className="px-4">{project.sessions.toLocaleString()}회</td>
                              <td className="px-4">{project.modalViews.toLocaleString()}회</td>
                              <td className="px-4">{project.detailViews.toLocaleString()}회</td>
                              <td className="whitespace-nowrap px-4">{duration(project.activeMs)}</td>
                              <td className="whitespace-nowrap px-4">{duration(project.averageActiveMs)}</td>
                              <td className="px-4">{project.githubClicks.toLocaleString()}회</td>
                              <td className="px-4">{project.demoClicks.toLocaleString()}회</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
                <section className="overflow-hidden rounded-xl border bg-white">
                  <h2 className="border-b px-5 py-4 font-semibold">
                    방문 기록
                  </h2>
                  {!data.sessions.length ? (
                    <p className="px-5 py-12 text-center text-sm text-neutral-500">
                      선택한 기간에 수집된 방문이 없습니다. 제출 링크를 발급해
                      공유한 뒤 확인해 보세요.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 text-xs text-neutral-500">
                          <tr>
                            {[
                              "제출 링크 / 상태",
                              "방문 시작",
                              "마지막 수신",
                              "활성 시간",
                              "최대 스크롤",
                              "프로젝트",
                              "상세",
                            ].map((x) => (
                              <th
                                className="whitespace-nowrap px-4 py-3 font-medium"
                                key={x}
                              >
                                {x}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.sessions.map((s) => (
                            <tr key={s.id} className="border-t">
                              <td className="min-w-44 px-4 py-4">
                                <p className="font-medium">
                                  {s.companyLabel ?? "출처 미확인"}
                                </p>
                                <p className="mt-1 text-xs text-neutral-400">
                                  {s.isTest ? "테스트 · " : ""}
                                  {s.suspectedBot
                                    ? "자동화 의심"
                                    : s.observedActivity
                                      ? "활동 관측"
                                      : "접속 관측"}
                                </p>
                              </td>
                              <td className="whitespace-nowrap px-4">
                                {dateTime(s.startedAt)}
                              </td>
                              <td className="whitespace-nowrap px-4">
                                {dateTime(s.lastReceivedAt)}
                              </td>
                              <td className="whitespace-nowrap px-4">
                                {duration(s.activeMs)}
                              </td>
                              <td className="px-4">
                                {Math.round(s.maxDepth)}%
                              </td>
                              <td className="px-4">{s.projectViews}회</td>
                              <td className="px-4">
                                <button
                                  className={buttonClass + " whitespace-nowrap"}
                                  onClick={() => setSelected(s.id)}
                                >
                                  상세 보기
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
                <div className="mt-4 flex gap-2">
                  {cursor && (
                    <button
                      className={buttonClass}
                      onClick={() => {
                        setLoading(true);
                        setCursor("");
                      }}
                    >
                      첫 페이지
                    </button>
                  )}
                  {data.nextCursor && (
                    <button
                      className={buttonClass}
                      onClick={() => {
                        setLoading(true);
                        setCursor(data.nextCursor!);
                      }}
                    >
                      다음 페이지
                    </button>
                  )}
                </div>
                <p className="mt-4 text-xs leading-5 text-neutral-400">
                  활성 시간은 화면이 보이며 최근 60초 안에 활동이 있었던 시간을
                  뜻합니다. 탭별 세션을 구분하며 개인 수나 실제 정독 시간을
                  의미하지 않습니다.
                </p>
              </>
            )
          )}
        </>
      )}
      {selected && (
        <SessionDetail
          id={selected}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            setReload((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
