# Contributing to Shebagrid

How we work as a team, so the history stays clear and nobody's work collides.

## The workflow

1. **Pick an issue** from the project board and assign it to yourself. No issue yet? Create one first.
2. **Branch from an up-to-date `main`**:
   ```bash
   git checkout main && git pull
   git checkout -b feature/ward-mapping
   ```
3. **Commit small and often** (see below).
4. **Push and open a pull request** into `main`. Write `Closes #<issue>` in the description so the issue closes itself.
5. **Get one teammate's review**, and wait for the CI check to go green.
6. **Squash and merge**, then delete the branch.

Never push straight to `main`.

## Branch names

`feature/<short-name>`, `fix/<short-name>`, `docs/<short-name>`, `test/<short-name>`, `chore/<short-name>`

## Commit messages

Start with a type, then a short summary in the present tense:

```
feat: assign complaints to wards from GPS
fix: stop duplicate flag firing on resolved tickets
test: cover SLA escalation edge cases
docs: add week 6 project update
chore: bump dependencies
```

Commit with the name and email linked to your own GitHub account, otherwise your work will not show on your profile or in the contributors graph. Check with `git config user.email`.

## Before you open a PR

```bash
npm run lint
npm run typecheck
npm test
```

CI runs the same checks plus a production build. New logic gets a test.

## Secrets

- Real keys live only in `.env.local`, which is git-ignored.
- Add any new variable to `.env.example` with an empty value and a comment.
- Share keys privately, never in an issue, PR or commit.
- If a key is ever committed, treat it as leaked and rotate it. Deleting the commit is not enough.

## Database changes

Schema changes are SQL files in `supabase/migrations/`, named with a timestamp, and reviewed in a PR like code. Don't edit tables by hand in the Supabase dashboard without also adding the migration.

## Project updates

Every two weeks, add `docs/updates/week-NN.md` (copy `docs/updates/TEMPLATE.md`) in a PR. Keep it short: what was done, what is next, what is blocking us, and who did what.

## Reviewing a PR

Be kind and specific. Check that it does what the issue says, that it is tested, and that you understand it. Approve only when you could explain the change to someone else.
