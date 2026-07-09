# Clock Worksheet Generator

Static web page that renders 9 random analog clocks for printable time-telling practice worksheets. No build step, no package manager, no tests — plain HTML/CSS/JS with vendored jQuery. The design presents the page as a white worksheet "paper" on a chalkboard-green background; fonts (Fredoka, Atkinson Hyperlegible) load from Google Fonts with system fallbacks.

## Running

```sh
./local_server.sh   # serves the directory at http://localhost:8000
```

Then open `http://localhost:8000` and print the page. Reload to generate a new worksheet.

## Deploying

```sh
./deploy.sh   # rsyncs the site to the nginx server
```

Rsyncs `index.html`, `scripts/`, and `styles/` (nothing else — no `.git`, `CLAUDE.md`, or the script itself) to the server's nginx web root, with `--delete`. Server settings come from a gitignored `.env` (`DEPLOY_USER`, `DEPLOY_HOST`, `DEPLOY_PATH`); copy `.env.example` to `.env` and fill in the host to set up a new machine. The script aborts with a message if `.env` or any variable is missing. Rsync runs with `--no-owner --no-group` because the deploy user can't chown/chgrp files created by other users on the server.

## Configuration

Settings live in the panel at the top of the page (`#config-panel` in `index.html`, hidden when printing via the `.no-print` class):

- **Times to nearest** (`#config-interval`) — minute granularity of the random times: hour, half hour, quarter hour, 5 minutes, or minute. Changing it generates a new worksheet.
- **Answer Key** (`#config-answers`) — pre-fills the input under each clock with the answer (e.g. `3:45`) for printing an answer key; unchecked shows just `:`. Toggling only updates the inputs, the clocks keep their times.
- **Color** (`#config-colors`) — colored clock faces instead of white/black. Re-renders the current times with new colors.
- **Problem numbers** (`#config-numbers`) — shows a "1."–"9." label at the top-left of each clock cell. The labels are static `.problem-number` spans in `index.html`, revealed by `updateProblemNumbers()` toggling the `show-numbers` class on `.paper`; they're absolutely positioned so toggling doesn't reflow the grid or grow the printed page.
- **No duplicate times** (`#config-unique`) — forces all 9 times on the sheet to be distinct (rejection sampling in `newWorksheet()`, capped at 100 redraws per clock so the 12-time "hour" space can't loop forever). Off, only consecutive problems are guaranteed to differ. Changing it generates a new worksheet.
- **Seed** (`#config-seed`) — optional. Entering a number makes worksheets reproducible (same seed = same times/colors); blank picks a random seed. `newWorksheet()` writes the effective seed back into the field (on page load and whenever a worksheet is generated), so the field always shows the current sheet's seed. The seed is also printed tiny on the sheet footer (`#sheet-meta`) so the matching answer key can be regenerated later.
- **Randomize** (`#reset-seed`, next to the Seed field) — clears the seed field, strips any worksheet query params from the URL (`history.replaceState`), and generates a fresh random worksheet.
- **Save Worksheet** (`#bookmark-worksheet`) — does two things at once: (1) writes the current worksheet's settings into the address bar as query params (`?seed=…&interval=…&colors=1&numbers=1&unique=1&answers=1`) via `history.replaceState` and copies the link so it can be bookmarked/shared, and (2) saves the worksheet to the on-page **Saved worksheets** list (see below). The button briefly flashes "Link copied!" (or "URL updated" when the clipboard is unavailable, e.g. non-HTTPS). (Its element id is still `bookmark-worksheet` from when it was just a bookmark button.)
- **Print** (`#print-worksheet`) — calls `window.print()`. Around printing, `beforeprint`/`afterprint` swap `document.title` to a semantic filename from `worksheetFilename()` (e.g. `clock-worksheet_seed-424242_quarter-hour_answer-key_color`) and back, so a "Save as PDF" defaults to a name that identifies the worksheet instead of the page title. Using the print events covers both this button and the Ctrl/Cmd+P shortcut.

The same query params work on page load: `applyUrlParams()` in `script.js` pre-fills the panel from `?seed=`, `?interval=` (60/30/15/5/1), `?colors=`, `?numbers=`, `?unique=`, and `?answers=` (`1` or `true`) before the first worksheet is generated, so a bookmarked URL reproduces its worksheet exactly.

The printable sheet also carries text driven by the settings (`updateSheetText()` in `script.js`): the instruction line (`#sheet-instructions`) names the chosen interval, and a red "Answer key" stamp (`#answer-badge`) appears when Answer Key is on.

`script.js` reads the panel via `getConfig()`; there are no config variables to edit. The color palettes are still code-level config in `scripts/random.js`:

- `var darkColors` / `var lightColors` — hex color palettes for clock backgrounds. Dark backgrounds get white numbers, light backgrounds get black numbers. Individual colors are toggled by commenting/uncommenting entries; colors are sampled without replacement so all 9 clocks differ.

## Saved worksheets

**Save Worksheet** appends the current sheet to a list persisted in `localStorage` under `clockSavedWorksheets` (capped at 24 — appends to the end, oldest dropped from the front). The list renders as chips in `#saved-row` (`renderSavedWorksheets()` in `script.js`). Each chip's headline/meta come from `labelText()`/`chipLabel()`: a named sheet leads with its name and tucks `#seed · interval` into the meta line, an unnamed one leads with `#seed`. When the list is empty the eyebrow reads "Your saved worksheets will appear here." A worksheet's identity for de-duplication is `worksheetSignature()` — seed plus every render-affecting setting, but **not** the optional `name` — so re-saving the same settings updates in place and renaming never forks a chip.

Outside edit mode the chips are plain load buttons: clicking one calls `applySavedWorksheet()` to refill the panel and regenerate that exact sheet.

A single pencil (`#saved-tools`, left of the "Saved" eyebrow) toggles **edit mode** for the whole list. Edit mode is transactional: `enterSavedEdit()` clones the list into `savedDraft`, every edit mutates only the draft, and the pencil becomes a check (`commitSavedEdit()` → persist the draft) and an × (`exitSavedEdit()` → discard it). In edit mode each chip gains three zones:

- **Drag handle** (left) — reorder. The chip is only made `draggable` while the handle is held (grabbing the label/× never starts a drag). `reorderChip()` moves nodes live during the drag and animates the displaced chips with a FLIP transform (respecting `prefers-reduced-motion`); on drop the draft order is rebuilt from the DOM.
- **Rename button** (middle) — a small pencil sits beside the title and the zone highlights on hover. Clicking swaps it in place for a writing field: Enter/blur commits, Escape cancels, a blank value clears the name back to the seed.
- **Delete ×** (right) — removes the chip from the draft.

## Structure

- `index.html` — site header + control bar (both `.no-print`), then the worksheet `.paper` with a Name/Date header and a 3×3 grid of `.clock-cell` divs (`.clock1`–`.clock9`), each with an `<input class="time-input">` below it for writing the time. `updateInputs()` finds each input via `.closest('.clock-cell')`, so keep the clock and its input inside the same `.clock-cell`.
- `scripts/script.js` — entry point (loaded last). Reads the settings panel (`getConfig()`) and drives generation: `applyUrlParams()` (panel from query params, runs once before the first worksheet), `newWorksheet()` (picks/stores `currentSeed`, writes it back into the seed field, generates new times), `renderClocks()` (redraw via the `setAsClock` jQuery plugin), `updateInputs()` (answers/blanks), `updateSheetText()` (instructions/badge/seed note on the paper). It also owns the Save Worksheet handler (query params + clipboard + `saveWorksheet()`), the Saved-worksheets list and its edit mode (`renderSavedWorksheets()`, `enterSavedEdit()`/`commitSavedEdit()`/`exitSavedEdit()`, `reorderChip()` FLIP reorder), and `worksheetFilename()` (swapped into `document.title` around printing for the PDF filename).
- `scripts/random.js` — seeded PRNG (`rng`, `sampler`, `resetRandom`), random time generation (`randomTime`, `nextTime`), and `generateColorPairs()` which picks 9 font/background pairs per render.
- `scripts/anoClock.js` — third-party jQuery plugin (by Andrew Sheffield) that draws an analog clock; not project code, avoid editing.
- `scripts/jquery-2.2.4.min.js`, `scripts/bootstrap.min.js`, `styles/*.min.css` — vendored libraries, do not edit. Bootstrap and animate.css are no longer referenced by `index.html` (the layout is custom CSS grid/flex); only jQuery is still loaded.
- `deploy.sh` / `.env.example` — deployment (see Deploying above). `.env` holds the real server settings and is gitignored.
- `styles/style.css` — all project styles: design tokens in `:root`, screen layout (chalkboard + paper), a small-screen media query, the print stylesheet, and the clock-hand arrowhead rules used by the anoClock plugin's DOM (`.hour-hand .arm:before` etc. — keep these, including the `.white` variants). The oversized answer-box style is scoped to `input.time-input` (don't make it a bare `input` rule or it breaks the settings panel).

## Gotchas

- `random.js` must load before `script.js` (it defines `nextTime`, `resetRandom`, and `generateColorPairs`).
- The `setAsClock` plugin appends DOM into the clock div on every call — always `empty()` the div before re-rendering (renderClocks does this).
- Consecutive problems never share a time, but non-adjacent repeats are allowed unless "No duplicate times" is on.
- A `?seed=` URL (or a typed seed) fills the seed field, and `newWorksheet()` also writes the effective seed back into it, so regenerating keeps producing the same sheet until you clear the field — **Randomize** does exactly that (clears the field + strips URL params, then regenerates). That persistence is intended, not a bug.
- Reproducibility means "same seed = same first render": toggling **Color** re-rolls colors from the ongoing color generator, so the on-screen colors can drift from what a reload of the same seed shows. Times always reproduce.
- Saved-worksheets **edit mode is transactional** — rename/delete/reorder mutate only `savedDraft`; nothing persists until the check (`commitSavedEdit()`) is clicked, and the × (`exitSavedEdit()`) discards the draft.
- Drag-to-reorder uses the HTML5 drag-and-drop API, which doesn't fire on touch, so **reorder is desktop-only** (rename and delete still work on touch).
- Clock ticks and hands are inline `background-color` styles, which browsers skip when printing by default — the print stylesheet forces them with `print-color-adjust: exact` on `.paper`. Print sizes are tuned so the sheet fits one page; if you grow the header or clocks, re-check with a print preview.
- The mobile media query restyles `.answer-badge` — don't set `display` on it there, or it overrides the `hidden` attribute and the badge shows when answers are off.
