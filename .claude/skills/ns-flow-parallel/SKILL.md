---
name: ns-flow-parallel
description: Run several independent tickets in parallel, one git worktree and one visible Herdr workspace per ticket, each driven by /ns-flow-ticket. Then merge the resulting PRs into main one at a time.
disable-model-invocation: true
argument-hint: "<ticket paths or ids, space separated>"
---

# ns-flow-parallel

Read `~/.claude/skills/CONVENTIONS.md` first. Read `~/.claude/skills/herdr/SKILL.md` for the Herdr rules (IDs, `--no-focus`, never close panes you did not create).

Orchestrator only. It never edits project files and never implements. Each ticket is delivered by a normal interactive `claude` session running `/ns-flow-ticket` in its own Herdr workspace, so the user sees and approves every edit in that pane (CONVENTIONS "Code change approval" is kept unchanged).

## Preconditions

1. `test "${HERDR_ENV:-}" = 1`. If not, tell the user to start `herdr` and run this skill from a pane inside it, then stop.
2. `git status` is clean on the base branch (default `main`). If not, stop and report.
3. Tickets given. If none, list open unblocked tickets from the tracker (`docs/agents/issue-tracker.md`) and ask with `AskUserQuestion` (multi-select).

## 1. Plan the batch

For each ticket read `Status:` and `Blocked by:`. Then decide:

- Refuse tickets that are blocked by unresolved tickets, unless the user overrides.
- Warn when two tickets likely touch the same files (compare the files each ticket names). Recommend serializing those. Migrations, lockfiles, and shared config are the usual collisions.
- Show a table: ticket, branch name (`<type>/<ticket-id>-<slug>`), worktree path, conflict risk. Ask `AskUserQuestion`: start this batch (Recommended), change it, or stop.

## 2. Launch, one workspace per ticket

Per ticket, in order:

1. `herdr worktree create --cwd "$PWD" --branch <branch> --base <base> --path <repo>-wt/<ticket-id> --label <ticket-id> --no-focus`. Use an explicit sibling `--path` so worktrees stay outside the repo. Read the workspace, root pane IDs and worktree path from the JSON response.
2. Ensure the worktree can run the project (dependencies installed, env files present). Env files are usually untracked, so tell the user which ones to copy. Do not copy secrets yourself.
3. `herdr agent start <ticket-name> --kind claude --pane <root-pane-id> -- --ide`. Agent names match `[a-z][a-z0-9_-]{0,31}`. `--ide` auto-connects the session to VS Code so edit approvals open as diffs in the editor. It only connects when exactly one valid IDE window matches (see "Editor diffs").
4. `herdr agent prompt <ticket-name> "/ns-flow-ticket <ticket path>"` without `--wait`, so all tickets start at once.

Tell the user the workspace list and that each pane needs their approvals.

## Editor diffs

Terminal diffs are hard to review. Claude Code shows edit approvals as a diff in VS Code once a session is connected to it.

- Ask the user (`AskUserQuestion`) once per run: one VS Code window per worktree (Recommended, `code <worktree-path>` for each, so each session matches exactly one window), or one multi-root window with all worktrees added.
- Open the windows after step 1 and before step 3, so `--ide` finds them.
- If a session did not connect, tell the user to run `/ide` in that pane and pick the window. Approvals still work in the terminal as a fallback.
- Approve each diff in the editor. The per-file approval rule is unchanged.

## 3. Watch

Do not poll on a tight loop. Check `herdr agent list` when the user asks or when Herdr reports a state change. Report per ticket: `working`, `blocked` (waiting for the user), `idle` or `done`. If an agent is `blocked`, point the user to that workspace. Never answer an approval dialog for them.

A ticket is finished when its `Status:` is `done` and its PR is open. Read the PR URL from the ticket comments or `gh pr list --head <branch>`.

## 4. Merge into main, sequentially

Only when the user says to merge. One PR at a time, in dependency order:

1. Confirm with `AskUserQuestion` which PR is next.
2. Check the PR is green (`gh pr checks`) and rebased on the current `main`. If `main` moved, rebase the branch in its worktree. On conflicts, follow `mattpocock-skills:resolving-merge-conflicts` and let the user approve each resolution.
3. Merge that PR (`gh pr merge`, method per repo convention), then update the local base branch.
4. Repeat. After each merge, later branches are re-checked against the new `main`.

## 5. Cleanup

After a ticket's PR is merged and the user agrees: `herdr worktree remove --workspace <id>` and delete the local branch. Only remove workspaces this run created.

## Rules

- Never merge, push, or remove anything without an explicit confirmation in this run.
- Keep at most 3 tickets in flight unless the user asks for more.
- If any session fails or is abandoned, leave its worktree in place and report it. Do not clean up for the user.
