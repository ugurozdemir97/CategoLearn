# Architecture and data flow

## Technology

| Area | Current choice |
|---|---|
| App | Expo SDK 54, React Native 0.81, React 19 |
| Language | JavaScript and JSX |
| Navigation | React Navigation native stack |
| Main data | `expo-sqlite`, database file `app.db` |
| Preferences | AsyncStorage |
| Rich text | Pell Rich Editor/WebView and Render HTML |
| Localization | i18next with English and Turkish resources |

## Startup

`index.js` registers `App`. `App.js` prepares the database before rendering the
navigator, shows a loading or database-error screen when needed, and installs the
theme, language, sorting, clipboard, and safe-area providers.

Database setup currently creates missing tables and indexes. It does not contain a
versioned migration system, so changing an existing schema requires an explicit
migration rather than only editing `CREATE TABLE IF NOT EXISTS` statements.

## Code organization

- `screens/` and `components/` contain the user interface.
- `context/` contains small pieces of shared UI state.
- `database/queries.js` contains most database operations.
- `storage/` persists user preferences.
- `hooks/` and `utils/` hold reused interaction and sorting logic.

Some screens and hooks query SQLite directly. That is acceptable for a project of
this size. Introduce a service or repository layer only if repeated rules are
causing bugs or changes have become difficult—not to imitate a large application.

## Read flow

```text
Screen focus or route change
→ SQLite query
→ JavaScript sorting
→ local screen state
→ list rendering
```

Lists are generally reloaded when their screen receives focus. Sorting preferences
are stored in AsyncStorage. List data is not kept in a global store.

## Write flow

```text
User action
→ validation and conflict checks
→ one or more SQLite writes
→ close/reset UI state
→ reload the visible list
```

Several multi-step operations are not transactional. Transactions are worth adding
where an interruption could leave partial user data, especially deep copy, restore,
permanent deletion, card-plus-fields updates, and import-related changes.

## Navigation

The app uses its own headers and footers. Folder and card routes receive item data
and a breadcrumb path. Folder navigation often updates route parameters instead of
opening another copy of the same screen. Route objects can become stale; reread by
ID only when a decision needs current database values.

## State lifetime

| Data | Storage | Survives restart? |
|---|---|---|
| Folders, cards, fields | SQLite | Yes |
| Theme, language, sort preferences | AsyncStorage | Yes |
| Cut/copy clipboard | React context | No |
| Selection, open fields, modal state | Screen memory | No |

## Keep the architecture small

Do not add a global state library, dependency injection, elaborate domain layers,
telemetry platform, or performance infrastructure without evidence that it solves
a current problem. Local state, direct functions, and a small SQLite layer are a
reasonable fit for this app.
