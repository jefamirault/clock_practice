var interval = 60;

var answers = false;

var preventRepeats = true;
var timesUsed = [];

var i;
for (i = 0; i < 9; i++) {
    selector = ".clock" + (i + 1);
    let time = nextTime(interval);
    $(selector).setAsClock({
        setTime: time,
        // backgroundColor: nextBackgroundColor(),
        backgroundColor: 'white',
        numbers: true,
        ticks: 1,
        numberSize: '24px',
        // color: nextFontColor(),
        color: 'black',
        // borderRadius: nextBorderRadius()
        // borderRadius: nextBorderRadius()
    });
    text = answers ? timeString(time) : ":"
    $(selector).parents(1).children('input').val(text);
}


function randomHour() {
    return Math.floor(Math.random() * 12) + 1;
}

function randomMinute(interval) {
    if (interval === undefined)
        interval = 15;
    return (Math.round(60 * Math.random()) * interval) % 60;
}

function timeString(date) {
    return date.getHours().toString() + ":" + date.getMinutes().toString().padStart(2, '0');
}

function buildTime(hour, minute) {
    d = new Date();
    d.setHours(hour);
    d.setMinutes(minute);
    d.setSeconds(0);
    return d;
}

function randomColor() {
    var index = Math.floor(Math.random() * colors.length);
    color = colors.splice(index, 1);
    return color[0];
}

