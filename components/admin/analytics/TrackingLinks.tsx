"use client";
import { useCallback, useEffect, useState } from "react";
import type { LinkInput, TrackingLink } from "@/lib/analytics/types";
import { analyticsFetch, buttonClass, inputClass } from "./http";
const empty: LinkInput = {
  companyLabel: "",
  position: "",
  submittedAt: null,
  note: "",
};
export default function TrackingLinks() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [form, setForm] = useState<LinkInput>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const load = useCallback(async (nextCursor?: string | null) => {
    setError("");
    setLoading(true);
    try {
      const data = await analyticsFetch<{
        links: TrackingLink[];
        nextCursor: string | null;
      }>(
        "/api/admin/analytics/links" +
          (nextCursor ? "?cursor=" + encodeURIComponent(nextCursor) : ""),
      );
      setLinks((prev) => (nextCursor ? [...prev, ...data.links] : data.links));
      setCursor(data.nextCursor);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]); // initial list; mutations refresh explicitly
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await analyticsFetch("/api/admin/analytics/links/" + editing, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        });
        setEditing(null);
      } else {
        const data = await analyticsFetch<{ url: string }>(
          "/api/admin/analytics/links",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form),
          },
        );
        setUrl(data.url);
        setCopied(false);
      }
      setForm(empty);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function mutate(link: TrackingLink, remove = false) {
    if (
      remove &&
      !confirm(
        `${link.companyLabel} 링크를 삭제할까요? 기존 방문은 출처 미확인으로 표시됩니다.`,
      )
    )
      return;
    setBusy(true);
    try {
      await analyticsFetch("/api/admin/analytics/links/" + link.id, {
        method: remove ? "DELETE" : "PATCH",
        headers: { "content-type": "application/json" },
        ...(remove
          ? {}
          : { body: JSON.stringify({ disabled: !link.disabledAt }) }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <form onSubmit={submit} className="h-fit rounded-xl border bg-white p-5">
        <h2 className="font-bold">
          {editing ? "제출 링크 수정" : "기업별 제출 링크 발급"}
        </h2>
        <p className="mt-2 text-xs leading-5 text-neutral-500">
          지원 건마다 링크를 발급하면 해당 링크에서 발생한 방문을 묶어 볼 수
          있습니다.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            회사명
            <input
              required
              maxLength={100}
              className={inputClass + " mt-1"}
              value={form.companyLabel}
              onChange={(e) =>
                setForm({ ...form, companyLabel: e.target.value })
              }
            />
          </label>
          <label className="block text-sm">
            지원 직무
            <input
              maxLength={200}
              className={inputClass + " mt-1"}
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            제출일
            <input
              type="date"
              className={inputClass + " mt-1"}
              value={form.submittedAt ?? ""}
              onChange={(e) =>
                setForm({ ...form, submittedAt: e.target.value || null })
              }
            />
          </label>
          <label className="block text-sm">
            메모
            <textarea
              maxLength={1000}
              rows={3}
              className={inputClass + " mt-1"}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            disabled={busy}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            {editing ? "저장" : "링크 발급"}
          </button>
          {editing && (
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
            >
              취소
            </button>
          )}
        </div>
        {url && (
          <div className="mt-5 rounded-lg bg-neutral-50 p-3">
            <label className="text-xs">
              발급된 링크
              <input
                className={inputClass + " mt-2"}
                readOnly
                value={url}
                onFocus={(e) => e.target.select()}
              />
            </label>
            <p className="mt-2 text-xs text-neutral-500">
              링크는 지금 복사해 주세요. 다시 필요하면 새 링크를 발급합니다.
            </p>
            <button
              type="button"
              className={buttonClass + " mt-2"}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                } catch {
                  setError("링크 입력란을 선택해 직접 복사해 주세요.");
                }
              }}
            >
              {copied ? "복사됨" : "링크 복사"}
            </button>
          </div>
        )}
      </form>
      <section>
        <h2 className="mb-3 font-semibold">제출 링크 목록</h2>
        {error && (
          <div role="alert" className="mb-3 text-sm text-red-700">
            {error}{" "}
            <button className={buttonClass} onClick={() => load()}>
              다시 시도
            </button>
          </div>
        )}
        {loading && !links.length ? (
          <p>불러오는 중…</p>
        ) : !links.length ? (
          <p className="rounded-xl border bg-white p-8 text-center text-sm text-neutral-500">
            아직 발급한 링크가 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <article key={link.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">
                      {link.companyLabel}{" "}
                      <span className="text-xs font-normal text-neutral-400">
                        {link.disabledAt ? "비활성" : "사용 중"}
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {link.position || "직무 미입력"} ·{" "}
                      {link.submittedAt ?? "제출일 미입력"}
                    </p>
                    {link.note && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-600">
                        {link.note}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-start gap-2">
                    <button
                      className={buttonClass}
                      disabled={busy}
                      onClick={() => {
                        setEditing(link.id);
                        setForm({
                          companyLabel: link.companyLabel,
                          position: link.position,
                          submittedAt: link.submittedAt,
                          note: link.note,
                        });
                      }}
                    >
                      수정
                    </button>
                    <button
                      className={buttonClass}
                      disabled={busy}
                      onClick={() => mutate(link)}
                    >
                      {link.disabledAt ? "활성화" : "비활성화"}
                    </button>
                    <button
                      className={buttonClass + " text-red-700"}
                      disabled={busy}
                      onClick={() => mutate(link, true)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {cursor && (
          <button
            disabled={loading}
            className={buttonClass + " mt-4"}
            onClick={() => load(cursor)}
          >
            더 보기
          </button>
        )}
      </section>
    </div>
  );
}
