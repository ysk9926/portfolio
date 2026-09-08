import { test, expect } from "@playwright/test";
import { Pool } from "pg";
const dbUrl =
  process.env.ANALYTICS_TEST_DB_URL ??
  "postgres://seung-gyu@127.0.0.1:54329/portfolio_analytics_test";
if (!["127.0.0.1", "localhost"].includes(new URL(dbUrl).hostname))
  throw new Error("Browser tests require isolated local DB");
test("starts collection without showing consent controls", async ({ page }) => {
  let sessions = 0;
  await page.route("**/api/analytics/session", async (route) => {
    sessions += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sessionId: crypto.randomUUID(),
        ingestToken: "test-ingest-token",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    });
  });
  await page.route("**/api/analytics/events", (route) =>
    route.fulfill({ status: 202 }),
  );
  await page.goto("/");
  await expect.poll(() => sessions).toBe(1);
  await expect(page.getByRole("dialog", { name: "방문 분석 설정" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "방문 분석 설정" })).toHaveCount(0);
});
test("company link and section activity reach real isolated database automatically", async ({
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
    await page.getByRole("button", { name: /프로젝트 열기$/ }).first().click();
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
