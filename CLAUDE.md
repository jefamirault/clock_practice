# Clock Worksheet Generator

Static web page that renders 9 random analog clocks for printable time-telling practice worksheets. No build step, no package manager, no tests — plain HTML/CSS/JS with vendored jQuery and Bootstrap.

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
- **Seed** (`#config-seed`) — optional. Entering a number makes worksheets reproducible (same seed = same times/colors); blank keeps the random seed.
- **New Worksheet** — regenerates 9 new times with the current settings.

`script.js` reads the panel via `getConfig()`; there are no config variables to edit. The color palettes are still code-level config in `scripts/random.js`:

- `var darkColors` / `var lightColors` — hex color palettes for clock backgrounds. Dark backgrounds get white numbers, light backgrounds get black numbers. Individual colors are toggled by commenting/uncommenting entries; colors are sampled without replacement so all 9 clocks differ.

## Structure

- `index.html` — settings panel plus a 3×3 grid of clock divs (`.clock1`–`.clock9`), each with an `<input class="time-input">` below it for writing the time.
- `scripts/script.js` — entry point (loaded last). Reads the settings panel (`getConfig()`) and drives generation: `newWorksheet()` (new times), `renderClocks()` (redraw via the `setAsClock` jQuery plugin), `updateInputs()` (answers/blanks).
- `scripts/random.js` — seeded PRNG (`rng`, `sampler`, `resetRandom`), random time generation (`randomTime`, `nextTime`), and `generateColorPairs()` which picks 9 font/background pairs per render.
- `scripts/anoClock.js` — third-party jQuery plugin (by Andrew Sheffield) that draws an analog clock; not project code, avoid editing.
- `scripts/jquery-2.2.4.min.js`, `scripts/bootstrap.min.js`, `styles/*.min.css` — vendored libraries, do not edit.
- `deploy.sh` / `.env.example` — deployment (see Deploying above). `.env` holds the real server settings and is gitignored.
- `styles/style.css` — project styles. The oversized answer-box style is scoped to `input.time-input` (don't make it a bare `input` rule or it breaks the settings panel). `@media print { .no-print { display: none; } }` hides the panel when printing.

## Gotchas

- `random.js` must load before `script.js` (it defines `nextTime`, `resetRandom`, and `generateColorPairs`).
- The `setAsClock` plugin appends DOM into the clock div on every call — always `empty()` the div before re-rendering (renderClocks does this).
- Times can repeat across the 9 clocks; there is no repeat prevention.
