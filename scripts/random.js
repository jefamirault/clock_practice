var seed = Math.floor( Math.random() * 1000000 ); // random seed
// var seed = 111111;

// Super simple Psuedorandom Number Generator
// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
function rand() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function rng(startSeed) {
    let seed = (startSeed === undefined) ? Math.random() : startSeed; // not ||, seed 0 is valid
    return function() {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
}

var timeRng = rng(seed);

// Restart all generators from a new seed (used by the seed field in the settings panel)
function resetRandom(newSeed) {
    seed = newSeed;
    timeRng = rng(seed);
    colorRng = rng(seed);
}

function randomHour() {
    return Math.floor(timeRng() * 12) + 1;
}

function randomMinute(interval) {
    if (interval === undefined)
        interval = 15;
    return (Math.round(60 * timeRng()) * interval) % 60;
}

function randomTime(interval) {
    d = new Date();
    d.setHours(randomHour())
    d.setMinutes(randomMinute(interval))
    d.setSeconds(0);
    return d;
}

// function randomTimeString(interval) {
//     return timeString(randomHour(), randomMinute(interval));
// }

// function timeString(hour, minute) {
//     return hour.toString() + ":" + minute.toString().padStart(2, '0');
// }

// function buildTime(hour, minute) {
//     d = new Date();
//     d.setHours(hour);
//     d.setMinutes(minute);
//     d.setSeconds(0);
//     return d;
// }

// flat design colors: https://htmlcolorcodes.com/color-chart/
var darkColors = [
    '#b71c1c',
    '#880e4f',
    '#4a148c',
    // '#311b92',
    '#1a237e',
    // '#0d47a1',
    '#01579b',
    // '#006064',
    '#004d40',
    // '#1b5e20',
    '#33691e',
    '#827717',
    '#f57f17',
    // '#ff6f00',
    '#e65100',
    // '#bf360c',
    '#3e2723',
    // '#212121',
    '#263238'
];
var lightColors = [
    '#ffcdd2',
    // '#f8bbd0',
    '#e1bee7',
    // '#d1c4e9',
    '#c5cae9',
    // '#bbdefb',
    '#b3e5fc',
    // '#b2ebf2',
    '#b2dfdb',
    // '#c8e6c9',
    '#dcedc8',
    // '#f0f4c3',
    '#fff9c4',
    // '#ffecb3',
    '#ffe0b2',
    // '#ffccbc',
    // '#d7ccc8',
    // '#f5f5f5',
    '#cfd8dc'
];

// return a random element in the array (with replacement)
function sample(array) {
    let size = array.length;
    let index = Math.floor(rand() * size);
    return array[index];
}
// array to sample from, boolean whether to replace elements, r for random number generator
function sampler(array, replacement, r) {
    if (r === undefined)
        r = rng(seed);
    let arr = [];
    // preserve original array
    for (var i = 0; i < array.length; i++)
        arr[i] = array[i];
    return function() {
        let size = arr.length;
        let index = Math.floor(r() * size);
        if (replacement)
            return arr[index];
        else {
            element = arr.splice(index, 1)[0];
            return element;
        }
    };
}

var nextTime = randomTime;

var colorRng = rng(seed);

var fontColors = [];
var bgColors = [];

// Pick 9 font/background pairs: white text on a dark color or black text on a light one
function generateColorPairs() {
    fontColors = [];
    bgColors = [];
    var whiteOrBlack = sampler(['white', 'black'], true, colorRng);
    var sampleDarkColor = sampler(darkColors, false, colorRng);
    var sampleLightColor = sampler(lightColors, false, colorRng);
    for (let i = 0; i < 9; i++) {
        let fontColor = whiteOrBlack();
        let bgColor;
        if (fontColor === 'white')
            bgColor = sampleDarkColor();
        else
            bgColor = sampleLightColor();
        fontColors.push(fontColor);
        bgColors.push(bgColor);
    }
}

var nextBackgroundColor = function() {
    return bgColors.pop();
}
var nextFontColor = function() {
    return fontColors.pop();
}

var nextBorderRadius = function() {
    return (Math.floor(Math.random() * 50)).toString() + "%";
}

