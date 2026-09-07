"use client";
import { useEffect, useRef, useState } from "react";
import type { Region, SessionDetailData } from "@/lib/analytics/types";
import { analyticsFetch, dateTime, duration, buttonClass } from "./http";
const regionLabel = (r: Region) =>
  r.kind === "page"
    ? "페이지 전체"
    : r.kind === "section"
      ? r.key
      : `프로젝트 #${r.projectId} (${r.surface === "modal" ? "모달" : "상세"})`;
export default function SessionDetail({
  id,
  onClose,
  onDeleted,
}: {
  id: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<SessionDetailData | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    analyticsFetch<SessionDetailData>("/api/admin/analytics/sessions/" + id, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [id, reload]);
  async function remove() {
    if (
      !confirm(
        "이 방문 기록을 삭제할까요? 연결된 페이지와 이벤트도 삭제됩니다.",
      )
    )
      return;
    setDeleting(true);
    try {
      await analyticsFetch("/api/admin/analytics/sessions/" + id, {
        method: "DELETE",
      });
      onDeleted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 text-neutral-900 shadow-xl backdrop:bg-black/40"
      aria-labelledby="session-title"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="session-title" className="text-xl font-bold">
          방문 상세
        </h2>
        <button autoFocus className={buttonClass} onClick={onClose}>
          닫기
        </button>
      </div>
      {error ? (
        <div role="alert" className="mt-4 text-sm text-red-700">
          {error}{" "}
          <button
            className={buttonClass}
            onClick={() => setReload((v) => v + 1)}
          >
            다시 시도
          </button>
        </div>
      ) : !data ? (
        <p className="py-10 text-center">불러오는 중…</p>
      ) : (
        <>
          <div className="mt-5 rounded-xl bg-neutral-50 p-4">
            <p className="font-semibold">
              {data.session.companyLabel
                ? `${data.session.companyLabel} 제출 링크`
                : "출처 미확인"}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              {dateTime(data.session.startedAt)} · 활성{" "}
              {duration(data.session.activeMs)} · 최대 스크롤{" "}
              {Math.round(data.session.maxDepth)}%
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              체류 시간은 화면 노출과 최근 활동을 기준으로 추정합니다. 실제 독해
              여부를 확인하는 지표는 아닙니다.
            </p>
          </div>
          {data.pages.map((page) => (
            <section key={page.id} className="mt-6">
              <h3 className="font-semibold break-all">{page.path}</h3>
              <p className="mt-1 text-xs text-neutral-500">
                활성 {duration(page.activeMs)} · 스크롤{" "}
                {Math.round(page.maxDepth)}%
              </p>
              <div className="mt-3 space-y-3">
                {page.regions
                  .filter((r) => r.region.kind !== "page")
                  .map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between gap-2 text-sm">
                        <span>{regionLabel(r.region)}</span>
                        <span>
                          활성 {duration(r.activeMs)} / 노출{" "}
                          {duration(r.visibleMs)} · {r.entries}회 진입
                          {r.region.kind === "project" && ` · 스크롤 ${Math.round(r.region.kind === "project" && r.region.surface === "detail" ? page.maxDepth : r.maxDepth)}%`}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-neutral-100">
                        <div
                          className="h-2 rounded bg-neutral-800"
                          style={{
                            width: `${Math.min(100, page.activeMs ? (r.activeMs / page.activeMs) * 100 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))}
          <h3 className="mt-7 font-semibold">열람 순서</h3>
          <p className="mt-1 text-xs text-neutral-500">
            브라우저 시각 기준의 관측 순서입니다.
          </p>
          <ol className="mt-3 space-y-2 text-sm">
            {data.timeline
              .filter(
                (item) =>
                  !["exposure_delta", "interaction", "scroll_state"].includes(
                    item.event.type,
                  ),
              )
              .map((item, i) => {
                const e = item.event;
                const label =
                  e.type === "page_start"
                    ? "페이지 방문"
                    : e.type === "region_enter"
                      ? regionLabel(e.region) + " 노출"
                      : e.type === "project_open"
                        ? `프로젝트 #${e.projectId} 열기`
                        : e.type === "project_close"
                          ? `프로젝트 #${e.projectId} 닫기`
                          : e.type === "outbound_click"
                            ? `${e.target} 클릭`
                            : e.type;
                return (
                  <li key={i} className="flex gap-3">
                    <span className="w-16 shrink-0 text-neutral-400">
                      +{duration(item.atMs)}
                    </span>
                    <span>{label}</span>
                  </li>
                );
              })}
          </ol>
          {data.droppedEvents > 0 && (
            <p className="mt-4 text-sm text-amber-700">
              전송 대기 중 누락된 이벤트 {data.droppedEvents}개가 있습니다.
            </p>
          )}
          <button
            className={buttonClass + " mt-6 text-red-700"}
            disabled={deleting}
            onClick={remove}
          >
            이 방문 기록 삭제
          </button>
        </>
      )}
    </dialog>
  );
}
