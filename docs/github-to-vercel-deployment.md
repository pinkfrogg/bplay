# Deploying Studio Pavilion from GitHub to Vercel

## Important compatibility note

This repository is a full-stack React/Vite + Express + tRPC application. Its current production command builds `dist/public` for the frontend and bundles `server/_core/index.ts` into `dist/index.js`; the server entry starts a long-running Express listener. Vercel does not automatically run that existing listener merely because the repository is connected. Before using Vercel for production, the server API must be adapted to Vercel-compatible Functions or another supported server runtime, including the `/api/trpc` routes, database access, authentication callbacks, storage proxy, and the `/admin` login flow.

The least disruptive hosting option is the project’s existing managed full-stack hosting, because it already supplies the server runtime, database connection, storage helpers, and authentication environment. If Vercel is still the chosen destination, use the checklist below and do not consider the deployment complete until an unauthenticated collection page, an album page, the `/api/trpc` API, and `/admin` have all been tested on the Vercel domain.

## Part 1: Prepare the GitHub repository

1. Confirm that the intended repository is private and that you are signed into the correct GitHub account. The connected repository for this project is `pinkfrogg/melodies-dusklist`.

2. In the repository’s **Settings → Code security and analysis**, enable secret scanning and push protection if those options are available for the repository and plan. Also enable Dependabot alerts and security updates. These protections do not replace keeping secrets out of commits.

3. Confirm that `.env`, `.env.*`, local database files, build output, logs, and editor files are ignored. Never commit `ADMIN_PASSWORD`, `DATABASE_URL`, or storage/API keys.

4. From the project directory, run the local checks before pushing:

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   pnpm build
   ```

5. Commit and push the reviewed project to the production branch, normally `main`:

   ```bash
   git status
   git add client/src/components/ListeningRail.tsx client/src/index.css client/src/lib/headerTexture.test.ts docs todo.md
   git commit -m "Refine shared header decoration"
   git push origin main
   ```

   If your local repository uses a different GitHub remote or branch, check with `git remote -v` and `git branch --show-current` first. Do not copy or expose credential-bearing remote URLs into chat, screenshots, shell history, or documentation.

## Part 2: Connect GitHub to Vercel

1. Sign in at [Vercel](https://vercel.com/) with the GitHub account that can access the private repository.

2. Select **Add New → Project**, choose **Import Git Repository**, and authorize Vercel’s GitHub integration. Grant access only to the selected repository when GitHub offers the choice.

3. Select `pinkfrogg/melodies-dusklist`, then review the project settings before deploying. Set the production branch to `main` unless another branch is intentionally used.

4. Do not guess the framework settings. For this repository, verify the detected framework and output settings against the Vercel Vite guidance. The frontend build output is produced under `dist/public`, but the Express/tRPC backend also needs a Vercel-compatible Function entrypoint. If Vercel detects only a static Vite site, stop and adapt the backend before production use; otherwise the pages may load while login, catalog mutations, database queries, and `/api/trpc` fail.

5. Do not deploy yet if the project has no Vercel Function or equivalent server adapter for the current Express/tRPC server. A successful frontend build is not proof that the full-stack application works.

## Part 3: Add environment variables in Vercel

Open **Vercel Project → Settings → Environment Variables**. Add each variable to the environment where it is needed. For production use, select **Production**. Select **Preview** as well if preview deployments must use the database and admin flow, and select **Development** only if you intentionally use Vercel’s local-development workflow.

Use the exact names below. Enter the values manually from your secure password manager or the existing project Secrets panel; do not paste them into GitHub files or public issue comments.

| Variable | Environment | Purpose |
|---|---|---|
| `DATABASE_URL` | Production; Preview if needed | MySQL/TiDB connection used by Drizzle and catalog data. Use a production database with SSL/TLS as required by the provider. |
| `ADMIN_EMAIL` | Production; Preview if needed | Email accepted by the dedicated `/admin` owner login. |
| `ADMIN_PASSWORD` | Production; Preview if needed | Password for the dedicated owner login. Use a new production password, not a password shared in chat or used elsewhere. |
| `BUILT_IN_FORGE_API_URL` | Production; Preview if storage or built-in server APIs are retained | Server-side built-in API endpoint. |
| `BUILT_IN_FORGE_API_KEY` | Production; Preview if storage or built-in server APIs are retained | Server-side built-in API credential. Mark it sensitive/write-only where Vercel permits. |
| `VITE_FRONTEND_FORGE_API_URL` | Production; Preview if the frontend uses it | Frontend-accessible built-in API endpoint. |
| `VITE_FRONTEND_FORGE_API_KEY` | Production; Preview if the frontend uses it | Only use this if the project intentionally exposes a restricted frontend key; never put a server-only key in a `VITE_` variable. |
| `VITE_APP_TITLE` | Production; Preview | Website title configuration, if managed through environment settings. |
| `VITE_APP_LOGO` | Production; Preview | Website logo configuration, if managed through environment settings. |
| `VITE_ANALYTICS_ENDPOINT` | Production; Preview if analytics are enabled | Analytics endpoint. |
| `VITE_ANALYTICS_WEBSITE_ID` | Production; Preview if analytics are enabled | Analytics site identifier. |

Vercel applies environment-variable changes only to new deployments. After adding or changing variables, trigger **Deployments → Redeploy**, or push a new commit. If a secret is changed, invalidate the old deployment and rotate any related credentials as appropriate.

## Part 4: Configure the deployed admin access

The admin page is a separate route and is not meant to be linked from the public collection. After the Vercel deployment succeeds, use:

```text
https://YOUR-VERCEL-DOMAIN.vercel.app/admin
```

Replace `YOUR-VERCEL-DOMAIN` with the project domain shown by Vercel. Log in using the production values configured for `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The server derives its short-lived owner-cookie signing key from the configured admin password; no third admin secret is required.

The admin route will work only if the backend adapter is deployed and the database/API requests resolve on the same production domain. If the page loads but login returns a network error, a 404, or a tRPC error, the Vercel Function routing is incomplete; do not work around this by exposing credentials or making the admin route public.

After a successful login, test the following in the private admin area: catalog read, album edit, track edit, MP3 metadata fetching if enabled, saving a change, logout, and login again. Confirm that an incognito window cannot access catalog mutations without logging in.

## Part 5: Verify owner-only access

The public collection and album pages require no login. The only login flow is the separate owner page at `/admin`, which accepts `ADMIN_EMAIL` and `ADMIN_PASSWORD`; catalog writes remain protected by the owner cookie. Verify that an incognito visitor can browse and play music but cannot call catalog mutations without first signing in at `/admin`.

## Part 6: First-deployment verification

Use the Vercel deployment URL to verify the collection page, the album route `/albums/60001`, theme switching, search, playback, `/api/trpc` requests, and the `/admin` login. Then inspect Vercel runtime logs for Function errors and browser DevTools for failed network requests. Test a preview deployment from a branch before merging to `main`.

Once the full-stack API and admin route pass, future pushes to the connected production branch can deploy automatically, while pull requests can receive separate preview deployments. Keep the repository private and rotate production credentials before making the first public release.

## References

[1]: https://vercel.com/docs/git/vercel-for-github "Deploying GitHub Projects with Vercel"
[2]: https://vercel.com/docs/environment-variables "Vercel Environment Variables"
[3]: https://vercel.com/docs/frameworks/frontend/vite "Vite on Vercel"
[4]: https://vercel.com/docs/functions "Vercel Functions"
