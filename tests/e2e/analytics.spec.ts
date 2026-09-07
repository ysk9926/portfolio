import { test, expect } from "@playwright/test";
import { Pool } from "pg";
const dbUrl =
  process.env.ANALYTICS_TEST_DB_URL ??
  "postgres://seung-gyu@127.0.0.1:54329/portfolio_analytics_test";
if (!["127.0.0.1", "localhost"].includes(new URL(dbUrl).hostname))
  throw new Error("Browser tests require isolated local DB");
test("no action data before choice, or after rejection", async ({ page }) => {
  const sent: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/analytics\/(session|events)$/.test(new URL(r.url()).pathname))
      sent.push(r.url());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "거절", exact: true }).click();
  await page.evaluate(() => window.scrollBy(0, 1200));
  await page.getByRole("button", { name: "방문 분석 설정" }).click();
  await expect(
    page.getByRole("dialog", { name: "방문 분석 설정" }),
  ).toBeVisible();
  expect(sent).toEqual([]);
});
test("company link, section activity and revocation reach real isolated database", async ({
  page,
}) => {
  const pool = new Pool({ connectionString: dbUrl });
  const token = "test-" + crypto.randomUUID().replaceAll("-", "");
  const { createHash } = await import("node:crypto");
  const linkId = crypto.randomUUID();
  await pool.query(
    "insert into analytics_links(id,token_hash,company_label,position,note,created_at) values($1,$2,$3,$4,$5,now())",
    [
      linkId,
      createHash("sha256").update(token).digest("hex"),
      "E2E company",
      "engineer",
      "test only",
    ],
  );
  try {
    await page.goto("/?ref=" + token);
    await page.getByRole("button", { name: "허용", exact: true }).click();
    await expect
      .poll(async () =>
        Number(
          (
            await pool.query(
              "select count(*) from analytics_sessions where link_id=$1",
              [linkId],
            )
          ).rows[0].count,
        ),
      )
      .toBe(1);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.waitForTimeout(16000);
    await expect
      .poll(async () =>
        Number(
          (
            await pool.query(
              "select count(*) from analytics_events e join analytics_batches b on b.id=e.batch_id join analytics_page_views p on p.id=b.page_view_id join analytics_sessions s on s.id=p.session_id where s.link_id=$1 and e.type='exposure_delta' and e.payload->'region'->>'kind'='section'",
              [linkId],
            )
          ).rows[0].count,
        ),
      )
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "빠른 보기", exact: true }).first().click();
    const modal = page.locator('[data-analytics-surface="modal"]');
    await expect(modal).toBeVisible();
    await page.waitForTimeout(1200);
    await modal.evaluate((el) => el.scrollBy(0, 500));
    await page.getByRole("button", { name: "닫기", exact: true }).click();
    await page.waitForTimeout(15000);
    for (const type of ["project_open", "project_close"]) {
      await expect.poll(async () => Number((await pool.query(
        "select count(*) from analytics_events e join analytics_batches b on b.id=e.batch_id join analytics_page_views p on p.id=b.page_view_id join analytics_sessions s on s.id=p.session_id where s.link_id=$1 and e.type=$2", [linkId,type]
      )).rows[0].count)).toBeGreaterThan(0);
    }
    expect(new URL(page.url()).searchParams.has("ref")).toBe(false);
    await page.getByRole("button", { name: "방문 분석 설정" }).click();
    await page.getByRole("button", { name: "거절", exact: true }).click();
    const after: string[] = [];
    page.on("request", (r) => {
      if (/\/api\/analytics\/(session|events)$/.test(new URL(r.url()).pathname))
        after.push(r.url());
    });
    await page.evaluate(() => window.scrollBy(0, -500));
    await page.waitForTimeout(16000);
    expect(after).toEqual([]);
  } finally {
    await pool.query("delete from analytics_sessions where link_id=$1", [
      linkId,
    ]);
    await pool.query("delete from analytics_links where id=$1", [linkId]);
    await pool.end();
  }
});
test("anonymous users cannot read or mutate admin analytics", async ({
  request,
}) => {
  for (const path of [
    "/api/admin/analytics",
    "/api/admin/analytics/links",
    "/api/admin/analytics/sessions/11111111-1111-4111-8111-111111111111",
  ])
    expect((await request.get(path)).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin/analytics/links", {
        data: { companyLabel: "forbidden" },
      })
    ).status(),
  ).toBe(401);
});
