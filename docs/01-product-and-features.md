# Product and features

## Purpose

CategoLearn is a personal information organizer inspired by language learning. It
is not a conventional front/back flashcard app. A card can have any number of
named fields, such as Definition, Example, Translation, or Synonyms.

The same structure can also hold study notes, collections, ideas, or simple lists.
It is primarily built for its owner's needs, so new features should be added only
when they are genuinely useful.

## Content structure

```text
Folder (a root folder can act as a subject)
└── Subfolder
    └── Card
        └── Field (name and optional rich-text content)
```

Folders can be nested. Cards belong to folders, and fields belong to cards.

## Current features

- Create, rename, color, sort, move, copy, and delete folders, cards, and fields.
- Add several custom fields while creating a card.
- Format field content with basic rich-text tools.
- Navigate folders with breadcrumbs.
- Select several items for common actions.
- Search folder, card, and field names, plus stored field HTML.
- Soft-delete items, restore them from Trash, or permanently delete them.
- Choose English or Turkish and one of the built-in themes.
- Export and import the local SQLite database as a backup file.

Cut/copy state is kept only in memory and disappears when the app restarts.

## Main screens

| Screen | Purpose |
|---|---|
| Home | Lists root folders/subjects |
| Folder | Lists child folders and cards |
| Card Detail | Lists and expands a card's fields |
| Search | Searches active content |
| Trash | Restores or permanently deletes items |
| Settings | Changes sorting, theme, language, and backups |

## Deliberate boundaries

The app currently has no accounts, cloud sync, collaboration, server, spaced
repetition engine, reminders, audio, attachments, or tags. Those are possibilities,
not commitments. A feature should not be added merely because similar apps have it.

## Important user expectations

The app may be small, but its stored notes can still matter. The most important
quality goals are:

- existing data survives upgrades and normal failures;
- backup import cannot silently destroy the working database;
- permanent deletion is explicit;
- common invalid actions do not crash the app.
