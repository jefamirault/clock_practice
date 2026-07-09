// Configuration is read from the settings panel in index.html (#config-panel)

var currentTimes = [];
var currentSeed = null;

function getConfig() {
    return {
        interval: parseInt($('#config-interval').val(), 10),
        answers: $('#config-answers').is(':checked'),
        colors: $('#config-colors').is(':checked'),
        numbers: $('#config-numbers').is(':checked'),
        unique: $('#config-unique').is(':checked'),
        seed: $('#config-seed').val()
    };
}

// Remember the panel settings (not the seed) locally so they persist across visits
var SETTINGS_KEY = 'clockSettings';

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            interval: parseInt($('#config-interval').val(), 10),
            answers: $('#config-answers').is(':checked'),
            colors: $('#config-colors').is(':checked'),
            numbers: $('#config-numbers').is(':checked'),
            unique: $('#config-unique').is(':checked')
        }));
    } catch (e) { /* private mode or full storage — settings just won't persist */ }
}

// Restore panel settings from localStorage. Runs before applyUrlParams so a
// shared/bookmarked URL still wins over the locally remembered settings.
function applySavedSettings() {
    var s;
    try {
        s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    } catch (e) { return; }
    if (!s) return;
    if (intervalPhrases[s.interval]) $('#config-interval').val(s.interval);
    if ('answers' in s) $('#config-answers').prop('checked', !!s.answers);
    if ('colors' in s) $('#config-colors').prop('checked', !!s.colors);
    if ('numbers' in s) $('#config-numbers').prop('checked', !!s.numbers);
    if ('unique' in s) $('#config-unique').prop('checked', !!s.unique);
}

// Pre-fill the settings panel from URL parameters, e.g. ?seed=87860&interval=15&colors=1
function applyUrlParams() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('seed'))
        $('#config-seed').val(params.get('seed'));
    if (params.has('colors')) {
        var colors = params.get('colors');
        $('#config-colors').prop('checked', colors === '1' || colors === 'true');
    }
    if (params.has('numbers')) {
        var numbers = params.get('numbers');
        $('#config-numbers').prop('checked', numbers === '1' || numbers === 'true');
    }
    if (params.has('unique')) {
        var unique = params.get('unique');
        $('#config-unique').prop('checked', unique === '1' || unique === 'true');
    }
    if (params.has('answers')) {
        var answers = params.get('answers');
        $('#config-answers').prop('checked', answers === '1' || answers === 'true');
    }
    var interval = params.get('interval');
    if (interval !== null && intervalPhrases[parseInt(interval, 10)])
        $('#config-interval').val(parseInt(interval, 10));
}

// Generate 9 new times and redraw everything
function newWorksheet() {
    var config = getConfig();
    currentSeed = config.seed !== ''
        ? parseInt(config.seed, 10)
        : Math.floor(Math.random() * 1000000);
    // Surface the effective seed in the field so it's always visible/editable
    $('#config-seed').val(currentSeed);
    resetRandom(currentSeed);
    currentTimes = [];
    // Redraw until the time differs from the previous problem's (always), and
    // from every earlier problem's when "No duplicate times" is on. Attempts are
    // capped so a small time space (e.g. nearest hour: 12 times) can't loop forever.
    var used = {};
    for (var i = 0; i < 9; i++) {
        var time, key;
        for (var attempts = 0; attempts < 100; attempts++) {
            time = nextTime(config.interval);
            key = timeString(time);
            var clash = config.unique
                ? used[key]
                : i > 0 && key === timeString(currentTimes[i - 1]);
            if (!clash)
                break;
        }
        used[key] = true;
        currentTimes.push(time);
    }
    renderClocks();
    updateSheetText();
    refreshActiveChip();
}

var intervalPhrases = {
    60: 'hour',
    30: 'half hour',
    15: 'quarter hour',
    5: 'five minutes',
    1: 'minute'
};

// Instructions, answer-key stamp, and seed note on the printable sheet
function updateSheetText() {
    var config = getConfig();
    var phrase = intervalPhrases[config.interval];
    var instructions = 'Write the time shown on each clock' +
        (config.interval === 1 ? '.' : ', to the nearest ' + phrase + '.');
    $('#sheet-instructions').text(instructions);
    $('#answer-badge').prop('hidden', !config.answers);
    $('#sheet-meta').text(currentSeed !== null ? 'Seed ' + currentSeed : '');
}

// Show or hide the "1." – "9." labels next to the clocks
function updateProblemNumbers() {
    $('.paper').toggleClass('show-numbers', getConfig().numbers);
}

// Redraw the clocks for the current times (colors may change)
function renderClocks() {
    var config = getConfig();
    generateColorPairs();
    for (var i = 0; i < 9; i++) {
        var clock = $(".clock" + (i + 1));
        clock.empty();
        clock.setAsClock({
            setTime: currentTimes[i],
            backgroundColor: config.colors ? nextBackgroundColor() : 'white',
            numbers: true,
            ticks: 1,
            numberSize: '24px',
            color: config.colors ? nextFontColor() : 'black'
        });
    }
    updateInputs();
}

// Fill the inputs under the clocks with answers or a blank ":"
function updateInputs() {
    var config = getConfig();
    for (var i = 0; i < 9; i++) {
        var selector = ".clock" + (i + 1);
        var text = config.answers ? timeString(currentTimes[i]) : ":";
        $(selector).closest('.clock-cell').find('input.time-input').val(text);
    }
}

function timeString(date) {
    return date.getHours().toString() + ":" + date.getMinutes().toString().padStart(2, '0');
}

// ---- Saved worksheets: persisted in localStorage, shown as paper slips ------

var SAVED_KEY = 'clockSavedWorksheets';

var intervalCaptions = {
    60: 'nearest hour',
    30: 'nearest half hour',
    15: 'nearest quarter',
    5: 'nearest 5 min',
    1: 'nearest minute'
};

function readSavedWorksheets() {
    try {
        var list = JSON.parse(localStorage.getItem(SAVED_KEY));
        return Array.isArray(list) ? list : [];
    } catch (e) {
        return [];
    }
}

function writeSavedWorksheets(list) {
    try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    } catch (e) { /* private mode or full storage — saving just won't persist */ }
}

// A worksheet's identity: seed plus every setting that changes what it renders
function worksheetSignature(w) {
    return [w.seed, w.interval, +!!w.colors, +!!w.numbers, +!!w.unique, +!!w.answers].join('|');
}

// Which problems a sheet shows is determined only by the seed, the interval, and
// the no-duplicates rule. Answer Key, Color, and Problem numbers are formatting
// that leave the times unchanged, so a saved chip counts as active whenever these
// three match — even if the formatting differs.
function problemSignature(w) {
    return [w.seed, w.interval, +!!w.unique].join('|');
}

// Signature of the worksheet currently on the sheet, so a matching saved chip
// can be flagged as active
function currentSignature() {
    var c = getConfig();
    return problemSignature({ seed: currentSeed, interval: c.interval, unique: c.unique });
}

// Re-highlight the active saved chip after the current worksheet/settings change.
// Skipped while editing so it doesn't tear down the in-progress edit UI.
function refreshActiveChip() {
    if (!savedEditing) renderSavedWorksheets();
}

function saveWorksheet(w) {
    var sig = worksheetSignature(w);
    var list = readSavedWorksheets().filter(function(item) {
        return worksheetSignature(item) !== sig;
    });
    list.push(w);
    writeSavedWorksheets(list.slice(-24));
    renderSavedWorksheets();
}

// Load a saved worksheet back into the panel and regenerate it exactly
function applySavedWorksheet(w) {
    $('#config-seed').val(w.seed);
    $('#config-interval').val(w.interval);
    $('#config-colors').prop('checked', !!w.colors);
    $('#config-numbers').prop('checked', !!w.numbers);
    $('#config-unique').prop('checked', !!w.unique);
    $('#config-answers').prop('checked', !!w.answers);
    updateProblemNumbers();
    newWorksheet();
}

// Inline SVG icons — self-contained so they inherit currentColor and need no assets
var pencilIcon = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" '
    + 'stroke="currentColor" stroke-width="2.1" stroke-linecap="round" '
    + 'stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M12 20h9"/>'
    + '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
var renamePencil = '<svg class="saved-chip__rename-icon" viewBox="0 0 24 24" width="12" height="12" '
    + 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '
    + 'stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M12 20h9"/>'
    + '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
var checkIcon = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" '
    + 'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" '
    + 'stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
var gripIcon = '<svg viewBox="0 0 24 24" width="12" height="16" fill="currentColor" '
    + 'aria-hidden="true">'
    + '<circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>'
    + '<circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>'
    + '<circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>';

// ---- Saved-list edit mode ---------------------------------------------------
// A single pencil left of the row toggles edit mode for the whole list. Edits
// (rename, delete, reorder) are staged on a working copy and persisted when the
// user leaves edit mode via the check. Outside edit mode the chips are just load
// buttons. (exitSavedEdit() still discards the draft; it's the shared teardown.)
var savedEditing = false;
var savedDraft = null;   // working copy of the list while editing

function cloneWorksheet(w) {
    var copy = {};
    for (var k in w) if (w.hasOwnProperty(k)) copy[k] = w[k];
    return copy;
}

function enterSavedEdit() {
    savedDraft = readSavedWorksheets().map(cloneWorksheet);
    savedEditing = true;
    renderSavedWorksheets();
}
function commitSavedEdit() {
    if (savedDraft) writeSavedWorksheets(savedDraft);
    exitSavedEdit();
}
function exitSavedEdit() {
    savedEditing = false;
    savedDraft = null;
    renderSavedWorksheets();
}

// Headline + meta text for a slip. Named slip leads with the name and tucks the
// seed into the meta line so it stays available for regeneration; unnamed slip
// leads with the seed.
function labelText(w) {
    var interval = intervalCaptions[w.interval] || '';
    var named = !!w.name;
    return {
        headline: named ? w.name : '#' + w.seed,
        meta: named ? '#' + w.seed + (interval ? ' · ' + interval : '') : interval
    };
}

// Build the two-line label (headline + meta) for a loadable slip
function chipLabel(w) {
    var t = labelText(w);
    return [
        $('<span class="saved-chip__seed">').text(t.headline),
        $('<span class="saved-chip__meta">').text(t.meta)
    ];
}

// The middle zone of an editing chip: a rename button that swaps to a writing
// field in place (so tapping elsewhere doesn't tear down the rest of the chip).
// A small pencil beside the title signals it can be renamed.
function makeRenameButton(idx) {
    var t = labelText(savedDraft[idx]);
    var title = $('<span class="saved-chip__title">')
        .append($('<span class="saved-chip__seed">').text(t.headline))
        .append($(renamePencil));
    return $('<button type="button" class="saved-chip__rename-btn">')
        .attr('title', 'Rename this worksheet')
        .append(title)
        .append($('<span class="saved-chip__meta">').text(t.meta))
        .on('click', function() {
            var btn = $(this);
            var settled = false;
            var input = $('<input type="text" class="saved-chip__rename" maxlength="32">')
                .val(savedDraft[idx].name || '')
                .attr('placeholder', '#' + savedDraft[idx].seed)
                .attr('aria-label', 'Rename this worksheet');
            function settle(commit) {
                if (settled) return;
                settled = true;
                input.off('blur');
                if (commit) {
                    var v = input.val().trim();
                    if (v) savedDraft[idx].name = v;
                    else delete savedDraft[idx].name;
                }
                input.replaceWith(makeRenameButton(idx));
            }
            input.on('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); settle(true); }
                else if (e.key === 'Escape') { e.preventDefault(); settle(false); }
            });
            input.on('blur', function() { settle(true); });
            btn.replaceWith(input);
            input.trigger('focus').trigger('select');
        });
}

// Drag-to-reorder via the handle. The chip is only made draggable while the
// handle is held, so grabbing the label/× never starts a drag. Nodes are moved
// live during the drag; the draft order is rebuilt from the DOM on drop.
var draggingChip = null;
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Slide the other chips to their new spots when the order changes, using FLIP:
// measure before, reorder, then transform each moved chip back to where it was and
// let it transition to its natural position. Measuring/clearing transforms first
// makes mid-flight reorders continue smoothly instead of snapping.
function reorderChip(refChip, after) {
    var listEl = document.getElementById('saved-list');
    var dragEl = draggingChip[0];
    var refEl = refChip[0];
    // Already where we'd put it? Nothing to do (dragover fires continuously).
    if (after ? refEl.nextElementSibling === dragEl : refEl.previousElementSibling === dragEl) return;

    var others = Array.prototype.filter.call(listEl.children, function(el) { return el !== dragEl; });
    var before = others.map(function(el) { return el.getBoundingClientRect(); });

    if (after) refChip.after(draggingChip);
    else refChip.before(draggingChip);

    if (reduceMotion) return;
    others.forEach(function(el, i) {
        el.style.transition = 'none';
        el.style.transform = '';                 // measure the natural new position
        var now = el.getBoundingClientRect();
        var dx = before[i].left - now.left;
        var dy = before[i].top - now.top;
        if (dx || dy) el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    });
    requestAnimationFrame(function() {
        others.forEach(function(el) {
            el.style.transition = 'transform 180ms ease';
            el.style.transform = '';
        });
    });
}

function wireReorder(chip, handle) {
    handle.on('mousedown', function() { chip.attr('draggable', 'true'); });
    handle.on('mouseup', function() { chip.attr('draggable', 'false'); });
    chip.on('dragstart', function(e) {
        draggingChip = chip.addClass('saved-chip--dragging');
        var dt = e.originalEvent.dataTransfer;
        if (dt) { dt.effectAllowed = 'move'; dt.setData('text/plain', ''); }
    });
    chip.on('dragover', function(e) {
        if (!draggingChip || draggingChip[0] === chip[0]) return;
        e.preventDefault();
        var rect = chip[0].getBoundingClientRect();
        reorderChip(chip, e.originalEvent.clientX - rect.left > rect.width / 2);
    });
    chip.on('dragend', function() {
        chip.attr('draggable', 'false').removeClass('saved-chip--dragging');
        draggingChip = null;
        // Rebuild the draft from the on-screen order, then re-render to reset indices
        savedDraft = $('#saved-list .saved-chip').map(function() {
            return savedDraft[+$(this).attr('data-idx')];
        }).get();
        renderSavedWorksheets();
    });
}

function renderSavedWorksheets() {
    var list = savedEditing ? savedDraft : readSavedWorksheets();
    var container = $('#saved-list').empty();
    var tools = $('#saved-tools').empty();
    var empty = list.length === 0;

    $('.saved-eyebrow')
        .text(empty && !savedEditing ? 'Your saved worksheets will appear here.' : 'Saved')
        .toggleClass('saved-eyebrow--empty', empty && !savedEditing);

    // Left-of-list controls: a pencil to enter edit mode, or check/× to finish it
    if (savedEditing) {
        $('<button type="button" class="saved-tool saved-tool--save">')
            .attr('title', 'Done editing').attr('aria-label', 'Done editing')
            .html(checkIcon).on('click', commitSavedEdit).appendTo(tools);
    } else if (!empty) {
        $('<button type="button" class="saved-tool saved-tool--edit">')
            .attr('title', 'Edit saved worksheets').attr('aria-label', 'Edit saved worksheets')
            .html(pencilIcon).on('click', enterSavedEdit).appendTo(tools);
    }

    var activeSig = currentSignature();
    list.forEach(function(w, idx) {
        if (!savedEditing) {
            var active = problemSignature(w) === activeSig;
            var load = $('<button type="button" class="saved-chip__load">')
                .attr('title', active ? 'This worksheet is on the sheet' : 'Load this worksheet')
                .append(chipLabel(w))
                .on('click', function() { applySavedWorksheet(w); });
            if (active) load.attr('aria-current', 'true');
            $('<div class="saved-chip">')
                .toggleClass('saved-chip--active', active)
                .append(load)
                .appendTo(container);
            return;
        }
        var chip = $('<div class="saved-chip saved-chip--edit">').attr('data-idx', idx);
        var handle = $('<span class="saved-chip__handle" title="Drag to reorder" aria-hidden="true">')
            .html(gripIcon);
        var forget = $('<button type="button" class="saved-chip__forget">×</button>')
            .attr('aria-label', 'Delete ' + (w.name || 'worksheet ' + w.seed))
            .on('click', function() { savedDraft.splice(idx, 1); renderSavedWorksheets(); });
        chip.append(handle, makeRenameButton(idx), forget).appendTo(container);
        wireReorder(chip, handle);
    });
}

$('#config-interval').on('change', newWorksheet);
$('#config-seed').on('change', newWorksheet);
$('#reset-seed').on('click', function() {
    $('#config-seed').val('');
    // Clear any bookmarked worksheet params so the URL reflects a fresh random sheet
    history.replaceState(null, '', location.pathname);
    newWorksheet();
});
$('#config-unique').on('change', newWorksheet);
$('#config-colors').on('change', renderClocks);
$('#config-numbers').on('change', updateProblemNumbers);
$('#config-answers').on('change', function() {
    updateInputs();
    updateSheetText();
});
// Persist any settings change locally (seed is deliberately excluded)
$('#config-interval, #config-answers, #config-colors, #config-numbers, #config-unique')
    .on('change', saveSettings);
// Browsers use document.title as the default "Save as PDF" filename, so swap in a
// name that says which worksheet this is (seed + settings) around printing. Using
// beforeprint/afterprint covers the Print button and the Ctrl/Cmd+P shortcut alike.
function worksheetFilename() {
    var c = getConfig();
    var intervalSlug = { 60: 'hour', 30: 'half-hour', 15: 'quarter-hour', 5: '5-min', 1: '1-min' }[c.interval] || 'time';
    var parts = ['clock-worksheet', 'seed-' + currentSeed, intervalSlug];
    if (c.answers) parts.push('answer-key');
    if (c.colors) parts.push('color');
    if (c.unique) parts.push('unique');
    if (c.numbers) parts.push('numbered');
    return parts.join('_');
}

var pageTitle = document.title;
window.addEventListener('beforeprint', function() {
    pageTitle = document.title;
    document.title = worksheetFilename();
});
window.addEventListener('afterprint', function() {
    document.title = pageTitle;
});

$('#print-worksheet').on('click', function() {
    window.print();
});

// Put the current worksheet's settings in the address bar and copy the link,
// so the exact worksheet can be bookmarked or shared
var bookmarkLabel = $('#bookmark-worksheet').text();
var bookmarkTimer = null;
$('#bookmark-worksheet').on('click', function() {
    var config = getConfig();
    var params = new URLSearchParams();
    params.set('seed', currentSeed);
    params.set('interval', config.interval);
    if (config.colors)
        params.set('colors', '1');
    if (config.numbers)
        params.set('numbers', '1');
    if (config.unique)
        params.set('unique', '1');
    if (config.answers)
        params.set('answers', '1');
    history.replaceState(null, '', window.location.pathname + '?' + params.toString());

    saveWorksheet({
        seed: currentSeed,
        interval: config.interval,
        colors: config.colors,
        numbers: config.numbers,
        unique: config.unique,
        answers: config.answers
    });

    var button = $(this);
    function flash(text) {
        button.text(text);
        clearTimeout(bookmarkTimer);
        bookmarkTimer = setTimeout(function() { button.text(bookmarkLabel); }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText)
        navigator.clipboard.writeText(window.location.href).then(
            function() { flash('Link copied!'); },
            function() { flash('URL updated'); });
    else
        flash('URL updated');
});

applySavedSettings();
applyUrlParams();
updateProblemNumbers();
renderSavedWorksheets();
newWorksheet();
