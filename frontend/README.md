# Frontend: Audio Architecture dashboard

React 19 + Vite 8 + Tailwind CSS 4 single-page application for the Audio
Architecture & Playlist Structuring API. It implements the synopsis User
Interface module and calls the API for generation, history, custom tracks and
export.

## Run

From the repository root (Node 22.12+):

```powershell
npm --prefix frontend ci
npm --prefix frontend run dev      # http://localhost:3000
npm --prefix frontend run lint     # oxlint
npm --prefix frontend run build    # production bundle in frontend/dist
node scripts/test_frontend_api.mjs # service-layer tests
```

Start the Python API as well (`scripts/run_local.ps1` runs both). The API base
URL comes from `VITE_API_BASE_URL` and defaults to `http://localhost:8000`; the
deployment workflow sets it to the API Gateway endpoint at build time.

## Structure

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | Page layout, builder state, generation and modal wiring. |
| `src/services/api.js` | API client with the offline fallback (browser greedy optimizer, browser storage, local exports). |
| `src/services/audioSynthesizer.js` | Web Audio synthesized track previews and walkthrough playback. |
| `src/components/` | Builder controls, chart, tracklist, player bar and dialogs. |
| `src/components/genreColors.js` | Genre colours shared by chips, chart and tracklist. |
| `src/index.css` | Design tokens and shared component classes. |

## Design system

The interface is deliberately light and print-like rather than a dark dashboard:

- **Colour tokens** (`@theme` in `src/index.css`): `paper` #f3eee4,
  `paper-deep` #e9e1d1, `ink` #1b1a17, `ink-soft`, `muted` #6a6458, `rule`
  #d3c9b6, `accent` #c23d17 (vermillion), `accent-ink`, `olive`, `mustard`.
  All colours are solid; there are no translucent panels or blurs.
- **Type:** Fraunces for headings, Instrument Sans for text, JetBrains Mono for
  figures, loaded from Google Fonts with system fallbacks.
- **Structure:** ruled lines separate sections instead of cards. Shared classes
  include `.eyebrow`, `.field` / `.field-input` (underline inputs), `.btn`
  (`.btn-ink`, `.btn-line`, `.btn-small`), `.chip` (toggles driven by
  `aria-pressed`) and `.dialog-backdrop` / `.dialog-sheet`.

## Accessibility notes

Visible focus outlines, a skip link, `aria-pressed` toggles, keyboard-operable
chart points, focus-trapped dialogs that close with Escape, and reduced-motion
support. These are not a full WCAG audit; test with assistive technology before
a public release.
