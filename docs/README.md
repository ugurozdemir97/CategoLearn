# CategoLearn documentation

CategoLearn is a small, offline hobby project made primarily for personal use. It
organizes notes as folders, cards, and custom fields. The project should stay easy
to understand and pleasant to change.

## Project principles

- Prefer the smallest change that solves a real problem.
- Do not design for large teams, millions of users, or hypothetical scale.
- Do not add infrastructure, abstractions, or features without a current need.
- Protect personal data. Import, restore, permanent deletion, migrations, and
  multi-step database writes deserve more care than ordinary UI polish.
- Prevent avoidable crashes and show a useful message when recovery is possible.
- Use a few focused tests for risky data behavior; use simple manual checks for
  ordinary UI changes. Broad test suites are not a goal by themselves.

## Documents

1. [Product and features](./01-product-and-features.md)
2. [Architecture and data flow](./02-architecture-and-data-flow.md)
3. [Data model and lifecycle](./03-data-model-and-lifecycle.md)
4. [Codebase map](./04-codebase-map.md)
5. [Risks and priorities](./05-risks-and-priorities.md)
6. [Development approach](./06-development-approach.md)
7. [Developer and AI guide](./07-developer-and-ai-guide.md)

These notes describe the current code based mainly on static inspection. Runtime
behavior should be confirmed on a device when it matters. When documentation and
code disagree, the code and database schema are the source of truth.
