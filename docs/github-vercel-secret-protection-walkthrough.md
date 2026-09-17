# GitHub → Vercel Connection and Secret Protection Walkthrough

**Prepared for:** Studio Pavilion
**Scope:** Private GitHub repository, Vercel project connection, server-only admin credentials, and GitHub secret protection.

## Important deployment boundary

This project is a full-stack Vite, Express, tRPC, and database application. It is ready to be stored in a private GitHub repository, but it still needs a Vercel portability pass for the Express server, database connection, and Manus-managed storage/OAuth dependencies before it should be considered production-ready on Vercel. Connecting the repository is safe; treat the first Vercel build as a configuration test until that portability work is complete.

> Do not place `ADMIN_EMAIL`, `ADMIN_PASSWORD`, or `ADMIN_SESSION_SECRET` in GitHub, a committed `.env` file, or a `VITE_` variable. `VITE_` variables are bundled into browser code.

## 1. Connect the private GitHub repository to Vercel

1. Confirm that the latest project version is pushed to the `main` branch of your **private** GitHub repository.
2. Sign in to [Vercel](https://vercel.com/dashboard) with the same GitHub account that owns the repository.
3. Select **Add New → Project**.
4. If prompted, select **Continue with GitHub**, then grant Vercel access to the repository. Choose **Only select repositories** and select this one if GitHub presents that choice.
5. Find the repository in the import list and choose **Import**.
6. On the Configure Project screen, use the repository root (`.`) as the root directory. Do not add credentials to the source code or to build commands.
7. Add the variables in the next section on this screen before the first deployment, or add them later through **Project → Settings → Environment Variables**.
8. Do not rely on a successful Vercel deployment yet: complete the project’s Vercel portability work first, then select **Deploy**. Once connected, Vercel creates deployments for pushes by default; `main` is normally the production branch and other branches receive Preview deployments. [1]

## 2. Add the private admin environment variables

Open **Vercel Dashboard → your project → Settings → Environment Variables**. Add the following values one at a time.

| Name | Enter | Apply to | Sensitivity |
| --- | --- | --- | --- |
| `ADMIN_EMAIL` | The email used to sign in at `/admin` | Production and Preview | Sensitive if the option is available |
| `ADMIN_PASSWORD` | Your new private admin password | Production and Preview | **Sensitive** |
| `ADMIN_SESSION_SECRET` | Your new random session-signing secret (32+ characters) | Production and Preview | **Sensitive** |

For each variable, select the target environments, then click **Save**. If Vercel shows a **Sensitive** type, use it for the password and session secret. Sensitive values cannot be read back from the Vercel dashboard or CLI after they are created. [2]

When you change or add a variable, trigger a **new** deployment with a new commit or **Redeploy**. Environment changes affect future deployments, not the deployment already serving traffic. [3]

## 3. Enable GitHub secret scanning and push protection

1. Open the repository on GitHub.
2. Select **Settings**. If the tab is hidden, open the **More** menu first.
3. In the sidebar, under **Security and quality**, select **Advanced Security**.
4. If **Secret Protection** has an **Enable** control, select it and confirm **Enable Secret Protection**. This turns on secret-scanning alerts.
5. In the same Secret Protection area, enable **Push protection**. It checks supported secrets before they reach the repository and blocks a push when it finds one. [4] [5]
6. After the first push, open the repository’s **Security** tab and review **Secret scanning alerts**. If GitHub reports a real credential, rotate it immediately; do not merely delete the visible line from the latest commit. [5]

## Eligibility note for a private personal repository

GitHub’s current documentation states that Secret Protection is available for private/internal repositories owned by organizations with the relevant GitHub plan. It may not be offered for a personal private repository on GitHub Free. If **Secret Protection** or **Push protection** does not appear, this is an account/plan limitation rather than an error in your repository. Keep the repository private, retain the project `.gitignore`, use Vercel’s secret store, and review files before each push. [5]

## 4. Final pre-deployment checklist

- Confirm the GitHub repository is private.
- Confirm `.env*`, certificate/key files, and credential JSON files remain untracked.
- Keep the three admin values only in Manus project secrets and Vercel Environment Variables.
- Use the same GitHub/Vercel account as the repository owner to avoid private-repository deployment authorization issues. [1]
- After the Vercel portability pass, make a Preview deployment, test `/admin` with your new credentials, then promote the `main` deployment to production.

## References

[1]: https://vercel.com/docs/git "Vercel — Deploying Git Repositories with Vercel"
[2]: https://vercel.com/kb/guide/how-to-add-vercel-environment-variables "Vercel — How to add and manage environment variables"
[3]: https://vercel.com/docs/environment-variables/managing-environment-variables "Vercel — Managing environment variables"
[4]: https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks/enable-secret-scanning "GitHub Docs — Enabling secret scanning for your repository"
[5]: https://docs.github.com/code-security/secret-scanning/about-secret-scanning "GitHub Docs — Secret scanning"
