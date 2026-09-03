# Development approach

## Default approach

CategoLearn should remain a straightforward personal project. Work from observed
needs, keep changes local, and avoid speculative foundations for features that may
never be built.

When choosing between two designs, prefer the one with fewer concepts and less code
unless the more elaborate option clearly reduces a current data-loss or crash risk.

## Suggested order of work

### 1. Data safety

- Make database import validate before replacing the active file and roll back on
  failure.
- Explicitly enable foreign keys.
- Wrap risky multi-write operations in transactions.
- Introduce a minimal database version/migration step before changing the schema.

These are bounded improvements to existing code, not a request for a new platform
or architecture.

### 2. Bugs encountered in normal use

Fix crashes, confusing navigation, incorrect restore/delete behavior, stale lists,
and translation mistakes when they affect real workflows. Prefer small fixes close
to the existing implementation.

### 3. Features the owner actually wants

Before adding a feature, answer:

1. Will it be used soon?
2. Can it fit the current folders/cards/fields model?
3. Does it add a new data-loss or migration risk?
4. Is there a smaller version that provides most of the value?

Possible ideas in the root README—audio, reminders, tree view, and sync—are not a
roadmap. In particular, sync adds conflict handling and should not be treated as a
small toggle.

## What not to do by default

- Do not split every function into services, repositories, and interfaces.
- Do not add dependencies for logic that can be expressed clearly in a few lines.
- Do not optimize for huge datasets without measuring a problem on real data.
- Do not create large test matrices, coverage targets, or release bureaucracy.
- Do not convert the entire codebase to a new language or pattern during a feature
  fix.
- Do not add account, server, analytics, or collaboration infrastructure for
  hypothetical future use.

## Testing proportionately

Use manual smoke checks for most changes. Useful checks include reopening the app,
confirming persistence, and trying the changed action in both English and Turkish
when text is involved.

Use a small automated test when the logic is easy to isolate and a regression could
damage data—for example name validation, unique restore naming, a migration, or
transaction rollback. Tests are a safety tool, not a project-size goal.

## Performance

The current in-memory sorting and search are reasonable for a personal dataset.
Only optimize after a real device and real database show noticeable delay. Start
with the smallest measured fix, such as avoiding an unnecessary read or adding one
query index.
