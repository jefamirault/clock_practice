// Configuration is read from the settings panel in index.html (#config-panel)

var currentTimes = [];

function getConfig() {
    return {
        interval: parseInt($('#config-interval').val(), 10),
        answers: $('#config-answers').is(':checked'),
        colors: $('#config-colors').is(':checked'),
        seed: $('#config-seed').val()
    };
}

// Generate 9 new times and redraw everything
function newWorksheet() {
    var config = getConfig();
    if (config.seed !== '')
        resetRandom(parseInt(config.seed, 10));
    currentTimes = [];
    for (var i = 0; i < 9; i++)
        currentTimes.push(nextTime(config.interval));
    renderClocks();
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
        $(selector).parents(1).children('input').val(text);
    }
}

function timeString(date) {
    return date.getHours().toString() + ":" + date.getMinutes().toString().padStart(2, '0');
}

$('#config-interval').on('change', newWorksheet);
$('#config-seed').on('change', newWorksheet);
$('#new-worksheet').on('click', newWorksheet);
$('#config-colors').on('change', renderClocks);
$('#config-answers').on('change', updateInputs);

newWorksheet();
