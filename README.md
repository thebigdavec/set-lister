# Set Lister

Set Lister is a Vue 3 + Vite app for building printable set lists. Add sets, drop in songs, drag to reorder or move between sets, and generate a PDF-ready preview that auto-scales to fit an A4 page.

## Features
- Drag-and-drop song ordering and cross-set moves powered by SortableJS.
- Metadata capture (set list name, act, venue, date) shown on print previews.
- Save/Save As using the File System Access API when available, with a download fallback.
- Load existing set list JSON files and persist edits to localStorage with a dirty indicator.
- Print/export flow with a dedicated preview view that auto-scales song text to page bounds.

## Prerequisites
- Node.js >= 20.19.0
- pnpm (recommended) or npm

## Quick start
1) Install dependencies: `pnpm install`
2) Run the dev server: `pnpm dev` then open the printed URL (default http://localhost:5173)
3) Build for production: `pnpm build`
4) Preview the production build: `pnpm preview`
5) Type-check: `pnpm typecheck`

## Using the app
- Create sets via the File menu (`Add Set`) and add songs with titles and optional keys.
- Drag songs to reorder within a set or move them between sets.
- Edit metadata fields to surface details on the print layout; changes auto-save to localStorage and mark the app as edited.
- Use File → Save/Save As to write a JSON file; File → Load opens a saved set list (unsaved work prompts before losing changes).
- Click Export PDF to open the print preview; use `Print Now` and save as PDF in your browser. The preview auto-scales song text to fit the page.

## Data format
Saved files are simple JSON. Example:

```json
{
  "metadata": {
    "setListName": "Summer Tour 2024",
    "venue": "The O2 Arena",
    "date": "2024-06-15",
    "actName": "The Example Band"
  },
  "sets": [
    {
      "id": "uuid-1",
      "name": "Set 1",
      "songs": [
        { "id": "song-1", "title": "Opening Track", "key": "E" },
        { "id": "song-2", "title": "Ballad", "key": "C" }
      ]
    }
  ]
}
```

## Notes
- File System Access API works best in Chromium-based browsers; other browsers fall back to download/upload.
- The app warns before closing the tab when there are unsaved changes.
