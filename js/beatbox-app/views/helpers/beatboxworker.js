// beatboxworker zum regelmäßigen Abfeuern von Zeitereignissen
// basierend auf den Quellen: https://www.html5rocks.com/en/tutorials/audio/scheduling/
// https://github.com/cwilso/metronome/blob/master/js/metronomeworker.js

var timerID = null;
var interval = 100;

self.onmessage = function (e) {
    if (e.data == "start") {
        console.log("starting");
        timerID = setInterval(function () {
            postMessage("tick");
        }, interval)
    }
    else if (e.data.interval) {
        console.log("setting interval");
        interval = e.data.interval;
        console.log("interval=" + interval);
        if (timerID) {
            clearInterval(timerID);
            timerID = setInterval(function () {
                postMessage("tick");
            }, interval)
        }
    }
    else if (e.data == "stop") {
        console.log("stopping");
        clearInterval(timerID);
        timerID = null;
    }
};

