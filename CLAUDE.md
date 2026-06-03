# CLAUDE.md — Development standards for "Who, What, Where?"

This file is the source of truth for how work happens in this repo. Claude reads it on every session; humans should too. Keep it tight and accurate — if a rule here is wrong, fix it, don't work around it.

## Stack & environments

- **App**: Expo (React Native), TypeScript, NativeWind. Entry: `expo-router/entry`.
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions).
- **IAP**: RevenueCat.
- **Dev env**: Simulator → local Supabase CLI (ports 54331–54339). Physical device → prod via ngrok tunnel. See `scripts/start-device.sh` and `scripts/start-device-lan.sh`.
- **Prod**: linked Supabase project (see `supabase/.temp/project-ref`). TestFlight via EAS.

There is no staging environment today.

## Branching

- Branch off the latest `master` for every change. Never commit directly to `master`.
- Naming: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`, `refactor/<slug>`, `docs/<slug>`, `test/<slug>`.
- One logical change per branch. If scope creeps, open a second branch.
- Delete the branch after merge (GitHub auto-deletes; remove the local copy with `git branch -d <name>` and prune with `git fetch --prune`).

## Commits & PRs

- Commit subjects use a conventional prefix: `feat: …`, `fix: …`, `chore: …`, `refactor: …`, `docs: …`, `test: …`.
- Open PRs with `gh pr create`. The `.github/PULL_REQUEST_TEMPLATE.md` is pre-filled — fill in every section.
- **Squash-merge only.** GitHub is configured to disable merge commits and rebase merges.
- CI must be green before merging (see `.github/workflows/ci.yml`). Don't merge red builds.
- Tag prod releases manually after merge:
  ```
  git tag v<semver>          # e.g. v1.0.1
  git push origin v<semver>
  ```

## Local checks (run before opening a PR)

```
npm run typecheck
npm run lint
npm test
```

CI runs the same three. If they pass locally, they pass in CI.

## Tests

- Framework: Jest (`jest-expo` preset) + `@testing-library/react-native`. Config in `jest.config.js`.
- File naming: `*.test.ts` / `*.test.tsx`, colocated next to the code under test (e.g., `src/lib/avatar.ts` → `src/lib/avatar.test.ts`).
- **Required**: any new or substantively changed function in `src/lib/` has a test. The pure-function surface is what regression-protects the UI fallbacks.
- **Encouraged but not blocking**: component / hook tests. Skip when they'd require heavy Supabase or native-module mocking — re-evaluate as the codebase matures.
- See `src/lib/avatar.test.ts` for the pattern.

## Lint & format

- ESLint flat config in `eslint.config.js`, extending `eslint-config-expo/flat` + `eslint-config-prettier`.
- Prettier config in `.prettierrc`. Format on save (any editor) or run `npm run format`.

## Database migrations

- Files live in `supabase/migrations/NNN_<slug>.sql`. The `NNN` prefix is monotonically increasing — pick the next number after the highest existing file.
- Before pushing: `supabase db reset` against the local CLI to verify the full chain applies cleanly from scratch.
- After merge to `master`: deploy to prod with `supabase db push`. Confirm with the user before running.
- The remote migration history is already in sync with local (repaired 2026-06-02 for 001–011). Future `db push` calls just apply genuinely new migrations.

## Environment variables

All client-visible vars use the `EXPO_PUBLIC_*` prefix so Expo embeds them in the bundle. Don't put secrets here — anything `EXPO_PUBLIC_*` ships to users.

Tracked: `.env.example` (template, committed).
Untracked: `.env`, `.env.local`, `.env.development.local` (real values, gitignored).

**Rule**: adding a new env var requires updating `.env.example` in the same PR. Document its purpose in a comment on the same line in `.env.example`.

Current keys (keep this list in sync):
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (local CLI URL for dev; prod URL for builds)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key for the matching project
- `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` — RevenueCat public iOS key
- `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY` — RevenueCat public Android key

## Release & hotfix

- Normal release: merge PRs to `master` → tag `v<semver>` → `eas build --profile production` → `eas submit --profile production` (TestFlight).
- **Hotfix**: branch `fix/<slug>` off `master` → fast-track PR → squash-merge → bump patch (`vX.Y.Z+1`) → build & submit. If a migration is included, run `supabase db push` to prod before the build hits users.
- Never `eas submit` or `supabase db push` without explicit user confirmation — both ship to real users.

## Claude-specific rules

- **Confirm before** any of these: pushing to `master`, deploying migrations to prod (`supabase db push`), running `eas build` or `eas submit`, force-pushing, deleting branches with unmerged work.
- **Always run** `npm run typecheck && npm run lint && npm test` before opening a PR. If any fail, fix the cause — don't work around it.
- **Test coverage rule** above applies — new logic in `src/lib/` ships with a test in the same PR.
- **Env-var rule** above applies — `.env.example` updates in the same PR as the consuming code.
- When unsure which environment a command targets (local CLI vs prod Supabase), ask before running.

## Repo settings (applied via GitHub UI, documented here)

These need to be set on https://github.com/jessliu11/guess-who once, by a maintainer:

- **Branch protection on `master`**: require status check `CI / check`, disallow direct pushes, disallow force pushes.
- **Merge button**: enable "Squash and merge" only. Disable "Create a merge commit" and "Rebase and merge".
- **Auto-delete head branches after merge**: on.

## Out of scope (deferred)

- Staging Supabase project — add when team grows or QA needs a non-prod surface.
- Maestro / Detox E2E — add after critical paths stabilize post-launch.
- Required PR approvals — solo dev today; CI gating is the safety net.
- Automated changelog / version bumping — manual tagging is fine at current cadence.
- husky / lint-staged — CI is sufficient. Add later if drift becomes a problem.
