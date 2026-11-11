# CLAUDE.md - Mirrorwork

Instructions for AI assistants working in this repository.

## What this is

A card-matching memory game with five procedurally drawn decks (all card art is drawn by code, no image files). It is also one of the nine Compendium II volumes.

- Live: https://connex222.github.io/MIRRORWORK/ (GitHub Pages, updates automatically from `main`)
- Audience: Puzzle players on phones.

## Architecture

- **One self-contained file: `index.html`.** All CSS, JavaScript, fonts and artwork live inside it.
- State is saved in the browser's `localStorage`. Keys start with `mirrorwork.` (`best`, `muted`, `prefs`). Never rename an existing key without migrating the old data, or players lose their progress.

## Hard rules

- **Fully offline.** No network requests: no CDNs, no fonts or images from the internet, no analytics, no `fetch`.
- **No external dependencies.** Everything stays inside `index.html`.
- Readable in direct sunlight and in the dark (provide both light and dark themes with strong contrast).
- Works one-handed on a phone in portrait, and safe to interrupt at any moment without losing progress.
- Free to use. Do not add adverts, tracking or sign-ups.

## Project notes

- Changes here should also be made to the Mirrorwork volume inside COMPENDIUM-2, so the two stay in step.

## Working with Shaun (the owner)

- Shaun is not a programmer. Explain every step in plain English, in order, and assume no prior knowledge.
- Always return the complete `index.html`, never partial snippets or "..." placeholders.
- Use UK English.
- Before saying a change is finished, check that the file still opens with no errors in the browser console.
- Never force-push, rewrite history or rename the repository.
