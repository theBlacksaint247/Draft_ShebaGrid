# Contributing

## Workflow

1. Pick an issue from the project board and assign it to yourself. If there is no issue, create one.
2. Branch from an up-to-date `main`:
   ```bash
   git checkout main && git pull
   git checkout -b feature/ward-mapping
   ```
3. Commit small and often.
4. Push and open a pull request into `main`. Add `Closes #<issue>` to the description.
5. Get one review and wait for CI to pass.
6. Squash and merge, then delete the branch.

Don't push directly to `main`.

## Branch names

`feature/<name>`, `fix/<name>`, `docs/<name>`, `test/<name>`, `chore/<name>`

## Commit messages

```
feat: assign complaints to wards from GPS
fix: stop duplicate flag firing on resolved tickets
test: cover SLA escalation edge cases
docs: add week 6 project update
chore: bump dependencies
```

Use the email linked to your GitHub account (`git config user.email`) so your commits show up on your profile.

## Before opening a PR

```bash
npm run lint
npm run typecheck
npm test
```

CI runs these plus `npm run build`. New logic should come with tests.

## Secrets

- Keys go in `.env.local`, which is git-ignored.
- Add new variables to `.env.example` with an empty value.
- Share keys privately, not in issues, PRs or commits.
- If a key gets committed, rotate it.

## Database changes

Schema changes go in `supabase/migrations/` as timestamped SQL files and are reviewed in a PR. Don't change tables in the Supabase dashboard without adding a migration.

## Project updates

Every two weeks, copy `docs/updates/TEMPLATE.md` to `docs/updates/week-NN.md`, fill it in and open a PR.
