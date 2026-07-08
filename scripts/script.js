// Configuration is read from the settings panel in index.html (#config-panel)

var currentTimes = [];
var currentSeed = null;

function getConfig() {
    return {
        interval: parseInt($('#config-interval').val(), 10),
        answers: $('#config-answers').is(':checked'),
        colors: $('#config-colors').is(':checked'),
        numbers: $('#config-numbers').is(':checked'),
        seed: $('#config-seed').val()
    };
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
    resetRandom(currentSeed);
    currentTimes = [];
    for (var i = 0; i < 9; i++)
        currentTimes.push(nextTime(config.interval));
    renderClocks();
    updateSheetText();
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

$('#config-interval').on('change', newWorksheet);
$('#config-seed').on('change', newWorksheet);
$('#new-worksheet').on('click', newWorksheet);
$('#config-colors').on('change', renderClocks);
$('#config-numbers').on('change', updateProblemNumbers);
$('#config-answers').on('change', function() {
    updateInputs();
    updateSheetText();
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
    history.replaceState(null, '', window.location.pathname + '?' + params.toString());

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

applyUrlParams();
updateProblemNumbers();
newWorksheet();
