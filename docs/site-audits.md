# Public homepage audits

The Colophon displays the **last completed audit of the deployed homepage**.
Desktop and mobile each run three times, sequentially, in a clean browser.
Each category shows its median score; the reports include all six runs. Lower
scores are published normally. This is a measurement, not a perfect-score gate.

## Pipeline

`.github/workflows/site-audit.yml` starts on a main-branch push, a successful
`Workers Builds: homepage` check from Cloudflare's GitHub app, or a manual run.
The push trigger also covers GitHub's suppression of some `check_run` events.
The workflow runs trusted main-branch scripts; it never executes preview/PR code
with publishing credentials.

`scripts/audit-deployment.mjs` waits up to ten minutes for the successful
Cloudflare check and verifies the live footer links to the expected commit.
Duplicate events for the same Cloudflare build are skipped. A manual run forces
a fresh measurement. Superseded commits stop without publishing.

`scripts/audit-live.mjs` checks that same live commit before every Lighthouse run
and after the last one. It writes the summary, six HTML/JSON reports, and a plain
HTML index to ignored `lighthouse-report/published/`. Report pages use `noindex`.
The pinned
Playwright Chromium executable runs the pinned Lighthouse version from bun.lock.
No GitHub or Cloudflare credentials are sent to the audited browser.
On Linux GitHub Actions runners only, Chromium uses `--no-sandbox` because the
runner restricts sandbox startup for downloaded browsers. Local runs retain the
browser sandbox. Launcher errors are logged so a startup failure includes
Chromium's diagnostic output instead of only a refused DevTools connection.

A separate job checks the live commit again and publishes the artifact to
GitHub Pages at <https://gabbywelson.github.io/homepage/>. Only generated reports
are hosted there. The site continues to deploy through Cloudflare. Report
publication creates no source commit and cannot trigger another site deployment.
GitHub Pages replaces the previous report bundle; the UI links to the latest
report index rather than promising permanent history URLs.

Runtime errors, missing category scores, or a release changing mid-audit prevent
publication. The existing published report and its original date remain intact.
Scores aren't a guarantee of real-user performance, comprehensive accessibility,
or search ranking. The UI explicitly identifies the homepage, date, source,
device profiles, and aggregation method.

## One-time activation

1. Merge the feature onto main.
2. In the repository's **Settings → Pages**, select **GitHub Actions** as the
   publishing source. Keep the default `github.io` address; set no custom domain.
   Equivalently, an administrator can create the Pages site with:
   `gh api --method POST repos/gabbywelson/homepage/pages -f build_type=workflow`.
3. Run **Homepage Lighthouse** manually if the deployment finished before Pages
   was enabled. Subsequent main-branch releases run automatically.

The audit job needs only `contents: read` and `checks: read`. The publication job
uses GitHub's short-lived token with `pages: write` and `id-token: write`, plus
read access to its artifact. No personal token, new paid service, Cloudflare
secret, DNS changes, or custom domain is needed.

Cloudflare can redeploy the same commit without a new push. Its completed check
normally starts a new audit; **Run workflow** is the fallback if GitHub suppresses
that event. A failed deployment never becomes a public audit.

## Colophon behavior

The static Astro section loads a small, schema-validated `latest.json` directly
from the report host. Requests omit credentials and referrer information.
DOM updates use text nodes; report data supplies no executable HTML or URLs.
An unavailable or malformed response leaves honest placeholders and a link to
the dated reports. With JavaScript disabled, the complete static report index
and all Lighthouse reports remain reachable. No other route fetches the scores.

## Local verification

```sh
bun run check
GITHUB_ACTIVITY_DEMO=true bun run test
# Re-measure the real deployed release; this does not publish anything:
AUDIT_COMMIT=<full-live-commit> AUDIT_DEPLOYMENT_ID=<cloudflare-build-uuid> \
  node scripts/audit-live.mjs
```

The live collector intentionally has no arbitrary target URL option. It audits
only the public homepage with no browser extensions or saved authentication.
The existing `scripts/lighthouse.mjs` remains the local preview budget checker;
preview indexing protection is unchanged.

References: [Lighthouse variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md),
[Lighthouse CI browser troubleshooting](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/troubleshooting.md#lighthouse-is-failing-to-run-how-do-i-fix-it),
[workflow triggers](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#check_run),
[GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
