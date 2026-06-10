/**

 AnoClock is a jQuery plugin that animates the motion of clock arms.  It calculates the exact positon of each arms down to the millisecond and rotates the arms to match.  It has powerful but easy options to build a quick and responsive clock into an exist project or the plug in can be used on an existing clock UI.
 This project is open source and available for all uses.  I simply ask for recognition if forked, or leave this attribution if used.

 Author: Andrew J Sheffield
 Website: http://sheff.me
 Date: 05/21/2016
 Version: 1.0

 https://codepen.io/andrewsheffield/full/qZedNE

 Adapted by Jef Amirault

 */

(function($) {
    'use strict';

    var createDOMObj = function(parentObj, className) {
        parentObj.append("<div class='" + className + "'></div>");
        return parentObj.children('.' + className.split(' ')[0]).last();
    }

    var setClockUIProperties = function(o, options) {
        o.css({
            'position': 'relative',
            'height': '100%',
            'width': ' 100%',
        });
        if (options.styling || options.styling == null) {
            o.css({
                'background-color': options.backgroundColor || 'steelblue',
                'border': options.border || 'solid 3px black',
                'border-radius': options.borderRadius || '100%'
            });
        }
    }

    var buildTickMarks = function(o, level, options) {
        var num = (level == 2) ? 60 : 12;
        var _i;
        for (_i = 0; _i < num; _i++) {
            (function(i) {
                var tickCon = createDOMObj(o, 'tick-container');
                tickCon.css({
                    position: 'absolute',
                    'text-align': 'center'
                });
                if (options.styling || options.styling == null) {
                    tickCon.css({
                        left: '3%',
                        top: '3%',
                        height: '94%',
                        width: '94%',
                    });
                }
                tickCon.css({'transform': 'rotate(' + (360/num * i) + 'deg)'});
                if (i%5 == 0 || level == 1) {
                    var tick = createDOMObj(tickCon, 'tick');
                    tick.css({
                        position: 'absolute',
                        display: 'inline-block'
                    });
                    if (options.styling || options.styling == null) {
                        tick.css({
                            position: 'absolute',
                            width: '1%',
                            'margin-left': '-.5%',
                            height: '5%',
                            'background-color': options.color || 'white',
                            display: 'inline-block'
                        });
                    }
                }
                else {
                    var subTick = createDOMObj(tickCon, 'sub-tick');
                    subTick.css({
                        position: 'absolute',
                        display: 'inline-block'
                    });
                    if (options.styling || options.styling == null) {
                        subTick.css({
                            width: '1%',
                            'margin-left': '-.5%',
                            height: '2%',
                            'background-color': options.color || 'white',
                        });
                    }
                }
            })(_i);
        }
    }

    var buildNumbers = function(o, options) {
        var _i;
        for (_i = 0; _i < 12; _i++) {
            (function(i) {
                var numCon = createDOMObj(o, 'number-container');
                var num = (i == 0) ? 12 : i;
                numCon.html("<div class='number'>" + num +"</div>");
                numCon.css({
                    position: 'absolute',
                    'text-align': 'center'
                });
                if (options.styling || options.styling == null) {
                    numCon.css({
                        left: (options.ticks == 0) ? '2.5%' : '7.5%',
                        top: (options.ticks == 0) ? '2.5%' : '7.5%',
                        height: (options.ticks == 0) ? '95%' : '85%',
                        width: (options.ticks == 0) ? '95%' : '85%',
                    });
                }
                numCon.css({'transform': 'rotate(' + (360/12 * i) + 'deg)'});
                var numObj = numCon.children('.number').first();
                numObj.css({
                    transform: 'rotate(' + -(360/12 * i) + 'deg)',
                });
                if (options.styling || options.styling == null) {
                    numObj.css({
                        color: options.color || 'white',
                        'font-size': options.numberSize || '18px'
                    });
                }
            })(_i)
        }
    }

    var buildArms = function(o, options) {

        var center = createDOMObj(o, 'center');
        center.css({
            'position': 'absolute',
            'z-index': '1'
        });
        if (options.styling || options.styling == null) {
            center.css({
                'background-color': options.color || 'white',
                'color': options.color || 'white',
                'width': '5%',
                'height': '5%',
                'margin-top': '47.5%',
                'margin-left': '47.5%',
                'border-radius': '1000px'
            });
        }

        // var sHand = createDOMObj(o, 'second-hand');
        // sHand.css({
        //     'position': 'absolute',
        //     'text-align': 'center'
        // });
        // if (options.styling || options.styling == null) {
        //     sHand.css({
        //         'height': '90%',
        //         'width': '90%',
        //         'left': '5%',
        //         'top': '5%',
        //     });
        // }
        // var sArm = createDOMObj(sHand, 'arm');
        // sArm.css({
        //     'display': 'inline-block',
        // });
        // if (options.styling || options.styling == null) {
        //     sArm.css({
        //         'background-color': options.color || 'white',
        //         'color': options.color || 'white',
        //         'width': '1%',
        //         'height': '60%',
        //         'border-radius': '1000px'
        //     });
        // }

        var mHand = createDOMObj(o, 'minute-hand');
        mHand.css({
            'position': 'absolute',
            'text-align': 'center'
        });
        if (options.styling || options.styling == null) {
            mHand.css({
                'height': '90%',
                'width': '90%',
                'left': '5%',
                'top': '5%',
            });
        }

        var mArmClass = 'arm';
        if (options.color === 'white')
            mArmClass += ' white';

        var mArm = createDOMObj(mHand, mArmClass);
        mArm.css({
            'display': 'inline-block',
        });
        if (options.styling || options.styling == null) {
            mArm.css({
                'background-color': options.color || 'white',
                'color': options.color || 'white',
                'width': '3%',
                'height': '50%',
                'border-radius': '1000px'
            });
        }

        var hHand = createDOMObj(o, 'hour-hand');
        hHand.css({
            'position': 'absolute',
            'text-align': 'center'
        });
        if (options.styling || options.styling == null) {
            hHand.css({
                'height': '90%',
                'width': '90%',
                'left': '5%',
                'top': '5%',
            });
        }

        var hArmClass = 'arm';
        if (options.color === 'white')
            hArmClass += ' white';

        var hArm = createDOMObj(hHand, hArmClass);
        hArm.css({
            'display': 'inline-block',
        });
        if (options.styling || options.styling == null) {
            hArm.css({
                'background-color': options.color || 'white',
                'color': options.color || 'white',
                'width': '3%',
                'height': '25%',
                'margin-top': '25%',
                'border-radius': '1000px'
            });
        }

    }

    var initClockUI = function(clockObj, options) {

        setClockUIProperties(clockObj, options);

        if (options.ticks == 1 || options.ticks == 2) {
            buildTickMarks(clockObj, options.ticks, options);
        } else if (options.ticks == null) {
            buildTickMarks(clockObj, 2, options);
        }

        if (options.numbers || options.numbers == null) {
            buildNumbers(clockObj, options);
        }

        buildArms(clockObj, options);


    }

    $.fn.setAsClock = function(options) {
        var clockObj = this;
        var clock = {};

        var broke, UTCHourOffset;
        var init = function() {
            if (!options || options == null) options = {};

            if (options.initUI || options.initUI == null) {
                initClockUI(clockObj, options);
            }
            clock.sHand = clockObj.children(".second-hand").first();
            clock.mHand = clockObj.children(".minute-hand").first();
            clock.hHand = clockObj.children(".hour-hand").first();

            broke = options.static || false;

            if (options.UTCOffet === null || options.UTCOffset === undefined) {
                var d = new Date();
                UTCHourOffset = -(new Date().getTimezoneOffset() / 60)
            } else {
                UTCHourOffset = options.UTCOffset;
            }


        }();


        if (options.setTime !== undefined)
            var date = options.setTime;

        var getTimeDegrees = function(date) {
            var d, h, m, s, ms, secondsDeg, minutesDeg, hoursDeg;
            if (broke) {
                h = broke.hour || 0;
                m = broke.minute || 0;
                s = broke.second || 0;
                ms = 0;
            } else {
                d = date || new Date();
                h = d.getUTCHours() + UTCHourOffset;
                m = d.getMinutes();
                s = d.getSeconds();
                ms = d.getMilliseconds();
            }

            secondsDeg = (options.sweeping || options.sweeping == null) ? (ms * .001 + s) * 6 : s * 6;
            minutesDeg = (options.sweeping || options.sweeping == null) ? (m + (secondsDeg/6 * 1/60)) * 6 : m * 6;
            hoursDeg = (options.sweeping || options.sweeping == null) ? (h + (minutesDeg / 6 * 1/60)) * 30 : h * 30;

            return {hours: hoursDeg, minutes: minutesDeg, seconds: secondsDeg};
        }

        var setObjDeg = function (obj, deg) {
            obj.css({'transform': 'rotate(' + deg + 'deg)'});
        }

        if (!clock.sHand || !clock.mHand || !clock.hHand) {
            clockObj.html("<p style='background-color:red; color: white'>If you plan on using initUI: false, you will need dom objects for ''second-hand', 'minute-hand, and 'hour-hand' inside of your clock object.</p>");
        } else {
            // setInterval(function() {
            //     debugger;
                var degrees = getTimeDegrees(options.setTime);

                setObjDeg(clock.sHand, degrees.seconds);
                setObjDeg(clock.mHand, degrees.minutes);
                setObjDeg(clock.hHand, degrees.hours);

            // }, 30);
        }

        return this;

    }

})(jQuery);
