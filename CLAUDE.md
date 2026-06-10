# Clock Worksheet Generator

Static web page that renders 9 random analog clocks for printable time-telling practice worksheets. No build step, no package manager, no tests — plain HTML/CSS/JS with vendored jQuery and Bootstrap.

## Running

```sh
./local_server.sh   # serves the directory at http://localhost:8000
```

Then open `http://localhost:8000` and print the page. Reload to generate a new worksheet.

## Configuration

There is no UI for settings. All configuration is done by editing variables at the top of two files:

### `scripts/script.js`

- `var interval = 60;` — minute granularity of the random times. `60` = on the hour, `30` = half hours, `15` = quarter hours, `5` = five-minute marks, `1` = any minute.
- `var answers = false;` — when `true`, the input under each clock is pre-filled with the answer (e.g. `3:45`) to print an answer key. When `false`, inputs show just `:` for students to fill in.

### `scripts/random.js`

- `var seed = Math.floor( Math.random() * 1000000 );` — seed for the pseudorandom generator. Uncomment the fixed-seed line below it (`var seed = 111111;`) to get a reproducible worksheet (same times/colors every reload).
- `var darkColors` / `var lightColors` — hex color palettes for clock backgrounds. Dark backgrounds get white numbers, light backgrounds get black numbers. Individual colors are toggled by commenting/uncommenting entries; colors are sampled without replacement so all 9 clocks differ.

Note: colored clocks are currently disabled — in `script.js` the `setAsClock` call hardcodes `backgroundColor: 'white'` and `color: 'black'`. To re-enable colors, swap those lines for the commented-out `nextBackgroundColor()` / `nextFontColor()` calls.

## Structure

- `index.html` — page layout: 3×3 grid of clock divs (`.clock1`–`.clock9`), each with an `<input>` below it for writing the time.
- `scripts/script.js` — entry point (loaded last). Holds the config vars above and the loop that initializes each clock via the `setAsClock` jQuery plugin.
- `scripts/random.js` — seeded PRNG (`rng`, `sampler`), random time generation (`randomTime`, `nextTime`), and color-pairing logic that pre-computes 9 font/background pairs.
- `scripts/anoClock.js` — third-party jQuery plugin (by Andrew Sheffield) that draws an analog clock; not project code, avoid editing.
- `scripts/jquery-2.2.4.min.js`, `scripts/bootstrap.min.js`, `styles/*.min.css` — vendored libraries, do not edit.
- `styles/style.css` — project styles, including print layout for the worksheet.

## Gotchas

- `random.js` must load before `script.js` (it defines `nextTime` and the color samplers). `index.html` loads `script.js` with the path `../scripts/script.js`; browsers normalize this to `/scripts/script.js` from the server root, so it works, but keep it in mind if moving files.
- Both files define `randomHour`/`randomMinute`; the `script.js` versions (unseeded) win because it loads last, but `nextTime` was already bound to the seeded versions in `random.js`, so the seed still controls the clock times.
- Times can repeat across the 9 clocks despite `preventRepeats = true` in `script.js` — that flag is declared but not implemented.
