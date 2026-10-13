# Workflow profile

- **Teach level:** deep
- **Has UI:** yes
- **Versioning:** yes

## Host

- **Host:** Vercel
- **Production branch:** main
- **Production URL:** https://gfk.lol
- **Deploys when:** a merge to the production branch
- **Preview:** every PR gets a preview deployment; find its URL in the PR checks
- **Previews are protected:** yes; the way in is `VERCEL_AUTOMATION_BYPASS_SECRET`
- **Logs:** Vercel runtime logs, scoped to the deployment (`vercel logs --project google-keep-free --deployment <id>`)
- **Fastest undo:** the Rollback workflow (Actions > Rollback), which uses Vercel's instant rollback to the previous production deployment
- **Flags:** none

## Proof

- **Verification skill:** not set up yet (ticket 01.05.06)
- **Local env file:** `.env.local`
- **E2E:** Playwright · `npm run e2e` · CI workflow not set up yet (ticket 01.05.05)
