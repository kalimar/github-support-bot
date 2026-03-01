# Development Rules

Standards and constraints that govern how this project is built and maintained. These rules exist to keep the codebase auditable, the bot behavior predictable, and the automation safe to run in a public repo.

---

## 1. Workflow Rules

### 1.1 Trigger scope
- All issue-triggered workflows must use `issues: [opened]` as the sole trigger unless there is an explicit documented reason to add more event types
- Workflows must never trigger on their own bot comments (use `if: github.actor != 'github-actions[bot]'` guards)
- PR-triggered workflows are separate files from issue-triggered workflows — no combined trigger files

### 1.2 Permissions
- Every workflow file must declare explicit `permissions:` at the job level, not the workflow level
- Use the minimum permissions required: prefer `issues: write` over broader scopes
- Never use `contents: write` in a workflow unless it is specifically writing to the repo (e.g. dashboard data commit)
- `GITHUB_TOKEN` is the only allowed authentication method — no PATs, no third-party tokens

### 1.3 Secrets and configuration
- No hardcoded strings that vary by environment (repo names, usernames, thresholds) — use workflow `env:` blocks or a config file
- Label definitions live in `.github/labels.yml` — this is the single source of truth
- Response templates live in `.github/responses/` — one file per issue type

### 1.4 Idempotency
- Every workflow step must be safe to re-run without side effects
- Before posting a comment, check if the bot has already commented on that issue
- Before applying a label, check if it is already applied

---

## 2. Bot Behavior Rules

### 2.1 Tone
- All automated comments must be written in a helpful, neutral tone
- No exclamation marks in bot comments — they read as performative
- Every bot comment must end with a short human escalation path (e.g. "If this doesn't help, a team member will follow up")

### 2.2 Transparency
- Every bot comment must include a footer: `_This is an automated response. [View workflow run →](link)_`
- The label applied and the rule that matched it must be logged to the workflow step summary (`$GITHUB_STEP_SUMMARY`)
- No silent failures — if the bot cannot classify an issue, it applies `triage` and logs why

### 2.3 Non-destructive actions only
- The bot may: comment, apply labels, close issues marked as duplicates
- The bot may not: delete comments, remove labels set by humans, reopen issues, assign users
- Duplicate-close requires two conditions: a `duplicate` label AND a linked issue — never close on label alone

---

## 3. Code Standards

### 3.1 Language and runtime
- JavaScript (Node.js 20+) for all workflow scripts
- No TypeScript for now — keep the footprint minimal and readable without a build step
- Scripts live in `src/` and are called from workflows via `node src/<script>.js`

### 3.2 Style
- 2-space indentation
- Single quotes for strings
- No semicolons
- Files use ES modules (`import`/`export`) — set `"type": "module"` in `package.json`

### 3.3 Dependencies
- Prefer the GitHub-provided `@actions/core` and `@actions/github` packages over third-party alternatives
- Any new dependency requires a comment in `package.json` explaining why it was added
- Zero runtime dependencies for classification logic — use plain string matching, not an NLP library

### 3.4 Testing
- Every script in `src/` must have a corresponding test file in `src/__tests__/`
- Tests run via `npm test` using Node's built-in test runner (no Jest)
- CI runs `npm test` on every push to `main` — a failing test blocks merge

---

## 4. Documentation Rules

### 4.1 What must be documented
- Every workflow file must have a top-of-file comment block explaining: what it does, when it runs, and what permissions it uses
- Every response template must include a comment noting which user story it satisfies (e.g. `<!-- satisfies IR-03 -->`)
- Any change to label taxonomy must be reflected in both `labels.yml` and `USER_STORIES.md`

### 4.2 What does not need documentation
- Individual workflow steps that are self-explanatory from their `name:` field
- Test files — tests are documentation
- Config values that are defined by GitHub Actions spec (no need to re-explain `runs-on: ubuntu-latest`)

---

## 5. Git and Branch Rules

### 5.1 Branches
- `main` is always deployable — the dashboard reflects `main`, workflows run from `main`
- Feature branches use the pattern: `feature/<short-description>` (e.g. `feature/auto-label`)
- No long-lived branches — merge or delete within 7 days of creation

### 5.2 Commits
- Commits follow Conventional Commits: `type(scope): description`
- Allowed types: `feat`, `fix`, `docs`, `chore`, `test`
- Scope matches the area changed: `workflow`, `bot`, `dashboard`, `docs`
- Example: `feat(workflow): add auto-label on issue open`

### 5.3 Pull requests
- Every PR must reference a user story ID in the description (e.g. "Implements SE-01")
- PRs touching workflow files require a manual test: open a real issue and confirm the expected behavior before merging
- No self-merges — in a solo project, use a 24-hour cooling-off period before merging your own PR

---

## 6. Dashboard Rules

### 6.1 Data sourcing
- All metrics are pulled from the GitHub Issues API — no external database, no third-party analytics
- Dashboard data is regenerated by a scheduled workflow (`schedule: cron`) and committed as a JSON artifact
- The JSON artifact is committed to `docs/data/metrics.json` — this file is auto-generated and must not be edited manually

### 6.2 Frontend constraints
- Plain HTML, CSS, and vanilla JS only — no frameworks, no build tools
- Dashboard must load and display correctly with JavaScript disabled (show a static fallback message)
- No external fonts, icon libraries, or CDN dependencies — self-contained for reliability
