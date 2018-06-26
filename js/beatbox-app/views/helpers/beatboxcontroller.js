define([
    'jquery',
    'app/models/beat',
    'app/views/helpers/bufferloader',
    'app/views/helpers/utils',
    'app/views/helpers/gainnodecontroller',
], function ($, Beat, BufferLoader, Utils, GainNodeController) {
    function BeatBoxController(beats) {
        this.beats = beats;
        this.currentBeat = null;
        this.isPlaying = false;
        this.startTime;
        this.current16thNote;
        this.tempo = 120.0;
        this.lookahead = 25.0;
        this.scheduleAheadTime = 0.1;
        this.nextNoteTime = 0.0;
        this.timerWorker = null;
        this.soundBufferArray;
        this.gainNodeController = null;


        this.playBeat = function () {
            this.isPlaying = !this.isPlaying;

            if (this.isPlaying) {
                this.current16thNote = 0;
                this.nextNoteTime = Utils.audioContext.currentTime;
                this.timerWorker.postMessage("start");
                return "stop";
            } else {
                this.timerWorker.postMessage("stop");
                return "play";
            }
        };

        this.stopPlaying = function () {
            this.isPlaying = false;
            this.timerWorker.postMessage("stop");
        };

        this.saveBeat = function () {
            this.currentBeat.save();
        };

        this.setCurrentBeat = function () {
            if (this.beats.length > 0) {
                this.currentBeat = this.beats.last();
            } else {
                this.currentBeat = new Beat();
            }
        };

        this.init = function () {

            this.setCurrentBeat();
            this.gainNodeController = new GainNodeController(this.currentBeat.get("bars").length);

            var _this = this;
            var bufferLoader = new BufferLoader(
                Utils.audioContext,
                [
                    'sounds/kick.wav',
                    'sounds/snare.wav'

                ], function (bufferList) {
                    //geladene Sounds abspeichern
                    _this.soundBufferArray = bufferList;
                    var bars = _this.currentBeat.get("bars");

                    bars.forEach(function (bar) {
                        bar.sound = _this.soundBufferArray[0];
                    });

                    // Bar.prototype.sound = soundBufferArray[0];
                    // bars[2].sound = soundBufferArray[1];
                }
            );

            //Sounds laden
            bufferLoader.load();

            this.timerWorker = new Worker("js/beatbox-app/views/helpers/beatboxworker.js");

            this.timerWorker.onmessage = function (e) {
                if (e.data == "tick") {
                    console.log("tick!");
                    _this.scheduler();
                }
                else
                    console.log("message: " + e.data);
            };

            this.timerWorker.postMessage({"interval": this.lookahead});
        };

        this.scheduler = function () {

            while (this.nextNoteTime < Utils.audioContext.currentTime + this.scheduleAheadTime) {
                this.showPlayedNote();
                this.scheduleNote(this.current16thNote, this.nextNoteTime);
                this.nextNote();
            }
        };

        this.scheduleNote = function (beatNumber, time) {
            var _this = this;
            var notesToPlay = new Array(this.currentBeat.get("bars").length);
            var i = 0;
            var playing = false;
            this.currentBeat.get("bars").forEach(function (bar) {
                if (bar.notes[_this.current16thNote]) {
                    notesToPlay[i] = ({
                        sound: bar.sound,
                        volume: bar.volume / 100
                    });
                    // _this.playSound(bar.sound);
                    playing = true;
                }
                i++;
            });
            if (playing) {
                this.gainNodeController.playSound(notesToPlay);
            }

        };

        this.nextNote = function () {
            var secondsPerBeat = 60.0 / this.tempo;
            this.nextNoteTime += 0.25 * secondsPerBeat;
            this.current16thNote++;
            if (this.current16thNote == 16) {
                this.current16thNote = 0;
            }
        };

        this.playSound = function (buffer) {
            var source = Utils.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(Utils.audioContext.destination);
            source.start();
        };

        this.toggleNote = function (barNumber, noteNumber) {
            var bar = this.currentBeat.get("bars")[parseInt(barNumber)];
            bar.notes[noteNumber - 1] = !(bar.notes[noteNumber - 1]);
            return bar.notes[noteNumber - 1];
        };

        this.showPlayedNote = function () {
            var noteButtons = $('.noteBtn');
            $(noteButtons).attr('value', '');
            $(noteButtons)[this.current16thNote].value = 'played';
        };

        this.changeVolume = function (barIndex, volumeValue) {
            this.currentBeat.get("bars").volume = volumeValue;
            this.gainNodeController.adjustVolume(barIndex, volumeValue / 100);
        };

        this.init();
    }

    return BeatBoxController;
});