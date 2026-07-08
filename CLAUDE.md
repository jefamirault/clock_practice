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
- **Show answers** (`#config-answers`) — pre-fills the input under each clock with the answer (e.g. `3:45`) for printing an answer key; unchecked shows just `:`. Toggling only updates the inputs, the clocks keep their times.
- **Colored clocks** (`#config-colors`) — colored clock faces instead of white/black. Re-renders the current times with new colors.
- **Problem numbers** (`#config-numbers`) — shows a "1."–"9." label at the top-left of each clock cell. The labels are static `.problem-number` spans in `index.html`, revealed by `updateProblemNumbers()` toggling the `show-numbers` class on `.paper`; they're absolutely positioned so toggling doesn't reflow the grid or grow the printed page.
- **Seed** (`#config-seed`) — optional. Entering a number makes worksheets reproducible (same seed = same times/colors); blank picks a random seed per worksheet. The effective seed is always printed tiny on the sheet footer (`#sheet-meta`) so the matching answer key can be regenerated later.
- **New worksheet** — regenerates 9 new times with the current settings.
- **Bookmark** (`#bookmark-worksheet`) — writes the current worksheet's settings into the address bar as query params (`?seed=…&interval=…&colors=1&numbers=1`) via `history.replaceState` and copies the link, so the exact worksheet can be bookmarked or shared. The button briefly flashes "Link copied!" (or "URL updated" when the clipboard is unavailable, e.g. non-HTTPS).
- **Print** (`#print-worksheet`) — calls `window.print()`.

The same query params work on page load: `applyUrlParams()` in `script.js` pre-fills the panel from `?seed=`, `?interval=` (60/30/15/5/1), `?colors=`, and `?numbers=` (`1` or `true`) before the first worksheet is generated, so a bookmarked URL reproduces its worksheet exactly.

The printable sheet also carries text driven by the settings (`updateSheetText()` in `script.js`): the instruction line (`#sheet-instructions`) names the chosen interval, and a red "Answer key" stamp (`#answer-badge`) appears when Show answers is on.

`script.js` reads the panel via `getConfig()`; there are no config variables to edit. The color palettes are still code-level config in `scripts/random.js`:

- `var darkColors` / `var lightColors` — hex color palettes for clock backgrounds. Dark backgrounds get white numbers, light backgrounds get black numbers. Individual colors are toggled by commenting/uncommenting entries; colors are sampled without replacement so all 9 clocks differ.

## Structure

- `index.html` — site header + control bar (both `.no-print`), then the worksheet `.paper` with a Name/Date header and a 3×3 grid of `.clock-cell` divs (`.clock1`–`.clock9`), each with an `<input class="time-input">` below it for writing the time. `updateInputs()` finds each input via `.closest('.clock-cell')`, so keep the clock and its input inside the same `.clock-cell`.
- `scripts/script.js` — entry point (loaded last). Reads the settings panel (`getConfig()`) and drives generation: `applyUrlParams()` (panel from query params, runs once before the first worksheet), `newWorksheet()` (picks/stores `currentSeed`, generates new times), `renderClocks()` (redraw via the `setAsClock` jQuery plugin), `updateInputs()` (answers/blanks), `updateSheetText()` (instructions/badge/seed note on the paper), plus the Bookmark click handler (query params + clipboard).
- `scripts/random.js` — seeded PRNG (`rng`, `sampler`, `resetRandom`), random time generation (`randomTime`, `nextTime`), and `generateColorPairs()` which picks 9 font/background pairs per render.
- `scripts/anoClock.js` — third-party jQuery plugin (by Andrew Sheffield) that draws an analog clock; not project code, avoid editing.
- `scripts/jquery-2.2.4.min.js`, `scripts/bootstrap.min.js`, `styles/*.min.css` — vendored libraries, do not edit. Bootstrap and animate.css are no longer referenced by `index.html` (the layout is custom CSS grid/flex); only jQuery is still loaded.
- `deploy.sh` / `.env.example` — deployment (see Deploying above). `.env` holds the real server settings and is gitignored.
- `styles/style.css` — all project styles: design tokens in `:root`, screen layout (chalkboard + paper), a small-screen media query, the print stylesheet, and the clock-hand arrowhead rules used by the anoClock plugin's DOM (`.hour-hand .arm:before` etc. — keep these, including the `.white` variants). The oversized answer-box style is scoped to `input.time-input` (don't make it a bare `input` rule or it breaks the settings panel).

## Gotchas

- `random.js` must load before `script.js` (it defines `nextTime`, `resetRandom`, and `generateColorPairs`).
- The `setAsClock` plugin appends DOM into the clock div on every call — always `empty()` the div before re-rendering (renderClocks does this).
- Times can repeat across the 9 clocks; there is no repeat prevention.
- A `?seed=` URL (or a typed seed) fills the seed field, so "New worksheet" keeps regenerating the same sheet until the field is cleared — that's intended, not a bug.
- Reproducibility means "same seed = same first render": toggling Colored clocks re-rolls colors from the ongoing color generator, so the on-screen colors can drift from what a reload of the same seed shows. Times always reproduce.
- Clock ticks and hands are inline `background-color` styles, which browsers skip when printing by default — the print stylesheet forces them with `print-color-adjust: exact` on `.paper`. Print sizes are tuned so the sheet fits one page; if you grow the header or clocks, re-check with a print preview.
- The mobile media query restyles `.answer-badge` — don't set `display` on it there, or it overrides the `hidden` attribute and the badge shows when answers are off.
