# Combined GitHub activity

The homepage combines `gabbywelson` (personal) and `ggwelson` (work) below the bio
and above Work. It uses GitHub's contribution calendar: commits, pull requests,
issues, reviews, and other activity GitHub counts, rather than a commits-only log.

## Tokens

1. Sign in as **gabbywelson**, open
   [New personal access token (classic)](https://github.com/settings/tokens/new),
   and select **`read:user` only**. Choose an expiration date.
2. Repeat while signed in as **ggwelson**. Each token must belong to its matching
   account; the build checks this to prevent accidentally counting one account twice.
3. Add these variables to the existing `.env.local` (do not overwrite other values):

   ```dotenv
   GITHUB_PERSONAL_TOKEN=your_personal_account_token
   GITHUB_WORK_TOKEN=your_work_account_token
   ```

   Blank placeholders are in [`.env.example`](../.env.example). Never prefix these
   names with `PUBLIC_`. `.env.local` is ignored by Git.

GitHub's [`ContributionsCollection` documentation](https://docs.github.com/en/graphql/reference/users#contributionscollection)
specifies `read:user` for private/internal contributions. **No `repo`, `read:org`,
or write scope is needed for this aggregate calendar query.** This setup uses
classic PATs because GitHub documents that scope explicitly; fine-grained tokens
do not have a scope named `read:user` and are not the documented setup here.

For private activity, enable **Contribution settings → Private contributions**
on both profiles so GitHub can include anonymized counts. See
[GitHub's visibility instructions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements).
If Handshake requires SAML SSO, use **Configure SSO** on the work token to
[authorize it for the organization](https://docs.github.com/en/enterprise-cloud%40latest/authentication/authenticating-with-single-sign-on/authorizing-a-personal-access-token-for-use-with-single-sign-on).
Organization token policies still apply; do not broaden repository access to
work around them. GitHub can take time to recognize recent contributions.

## Preview and refresh

With both tokens present, restart the dev server or run `bun run build`. Astro
fetches each account's calendar with its own token, over the same 365 UTC dates
ending today. Only dates and counts are rendered; repository names, code, commit
messages, and tokens are never sent to visitors.

To see the layout before adding tokens:

```sh
GITHUB_ACTIVITY_DEMO=true bun run dev --background
```

This uses clearly labeled synthetic activity and makes no GitHub requests.
Stop that dev server before running other Astro checks/builds. A production build
(`SITE_INDEXABLE=true`, including `bun run deploy`) rejects demo mode. Leave
`GITHUB_ACTIVITY_DEMO` unset or `false` for real data.

The published graph is a **build-time snapshot**, labeled with its last date.
It refreshes on the next build and deployment, not when someone visits. Add the
same two variables as secrets in the environment that builds the site; Cloudflare
runtime secrets alone cannot affect already-generated static HTML. Daily updates
would require a daily build/deploy schedule, which this change does not configure.

With neither token present the section is omitted, allowing clean checkouts to
build. With only one token, an expired token, a timeout, an account mismatch, or an
incomplete response, the build fails with a sanitized error. This prevents a
release with a misleading partial graph; a failed build does not replace the
existing deployed site. Revoke/replace expired tokens and rebuild.

## Reading the chart

- Green is work; purple is personal. A diagonal split means both accounts were
  active that day. The halves indicate presence, not percentages.
- One shared four-level intensity scale comes from quartiles of combined nonzero
  daily totals. GitHub's per-account levels cannot simply be added, so the merged
  intensity is recalculated; it is not a claim to reproduce GitHub's private
  threshold algorithm exactly.
- Hover, tap, or focus a square for the date and both counts. Arrow keys navigate
  days/weeks with one tab stop; Home/End navigate the week, Control+Home/End the
  year. Mobile keeps readable squares and scrolls to the newest weeks.
- Counts are summed by date, without attempting cross-account deduplication.
  A contribution attributed by GitHub to both identities will count in both.
  Work means the entire `ggwelson` calendar, not an organization filter.

## Verification

```sh
bun run check
GITHUB_ACTIVITY_DEMO=true bun run test
```

If port 4322 is already in use, set `PLAYWRIGHT_PORT=4325` for the test command.

The tests cover date merging, leap days, response validation, token/account
separation, missing credentials, API errors, keyboard/touch interaction, both
themes, no-JavaScript rendering, and narrow layouts. CI uses synthetic data,
without personal tokens. The real private totals must be checked against each
profile after adding tokens.
