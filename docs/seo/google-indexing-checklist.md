# Google Indexing Checklist

Use this after each production deployment that changes canonical URLs, sitemap
URLs, or Search Console ownership.

## 1. Production Environment

Set these variables in Vercel Production and redeploy:

```bash
SITE_URL=https://your-domain.example
NEXT_PUBLIC_SITE_URL=https://your-domain.example
GOOGLE_SITE_VERIFICATION=search-console-verification-token
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

`SITE_URL` is the canonical source used by metadata, sitemap, robots, RSS, and
project detail URLs. When `SITE_URL` points to a custom domain, requests from a
default `*.vercel.app` host redirect to the canonical domain.

## 2. Search Console

1. Add the production domain in Google Search Console.
2. Verify ownership with the HTML meta tag method.
3. Confirm the deployed home page contains:

```html
<meta name="google-site-verification" content="..." />
```

4. Submit:

```text
https://your-domain.example/sitemap.xml
```

5. Use URL Inspection and request indexing for:

```text
https://your-domain.example/
https://your-domain.example/blog
https://your-domain.example/projects/<main-project-slug>
```

## 3. External Discovery Links

Add a visible portfolio link to indexed profiles:

- GitHub profile README: `ysk9926 포트폴리오`
- Velog profile and article footers
- YouTube channel description
- LinkedIn or RocketPunch profile, if used

Use the canonical custom domain, not the Vercel default domain.

## 4. Post-Deploy Checks

Run these checks against production:

```bash
curl -sS https://your-domain.example/robots.txt
curl -sS https://your-domain.example/sitemap.xml
curl -I https://your-domain.example/opengraph-image
curl -I https://your-domain.example/og-image.png
curl -sS https://your-domain.example | rg "canonical|google-site-verification|application/ld\\+json"
```

Expected results:

- `robots.txt` allows `/` and references the canonical sitemap.
- `sitemap.xml` contains home, blog, blog posts, tag pages, and project pages.
- `/opengraph-image` returns `200`.
- `/og-image.png` redirects to `/opengraph-image`.
- Home HTML contains canonical, verification meta, and JSON-LD.
