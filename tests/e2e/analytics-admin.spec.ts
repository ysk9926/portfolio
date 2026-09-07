import { test, expect } from "@playwright/test";
// Isolated fixture app renders production components; mocks only the API boundary.
// Real persistence, authority and aggregation are exercised by analytics-db tests.
test("dashboard renders aggregate values and link issuing form", async ({
  page,
}) => {
  await page.route("**/api/admin/analytics/links", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      expect(body.companyLabel).toBe("테스트 A사");
      await route.fulfill({
        json: { url: "https://portfolio.example/?ref=abcdefghijklmnopqrstuv" },
      });
    } else await route.fulfill({ json: { links: [], nextCursor: null } });
  });
  await page.route("**/api/admin/analytics?**", (route) =>
    route.fulfill({
      json: {
        summary: {
          sessions: 3,
          browsers: 2,
          medianActiveMs: 20000,
          observedSessions: 2,
        },
        links: [],
        sessions: [],
        nextCursor: null,
      },
    }),
  );
  await page.goto("/");
  await expect(page.getByText("20초", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "제출 링크" }).click();
  await page.getByLabel("회사명").fill("테스트 A사");
  await page.getByLabel("지원 직무").fill("프론트엔드");
  await page.getByRole("button", { name: "링크 발급", exact: true }).click();
  await expect(page.getByLabel("발급된 링크")).toHaveValue(
    /\?ref=[A-Za-z0-9_-]{22,64}$/,
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByLabel("회사명")).toBeVisible();
});
