/**
 * beatboxcontroller zum Verwalten von Beats
 *
 * @module beatboxcontroller.js
 */

define([
    'jquery',
    'app/models/beat',
    'app/views/helpers/bufferloader',
    'app/views/helpers/utils',
    'app/views/helpers/gainnodecontroller',
], function ($, Beat, BufferLoader, Utils, GainNodeController) {
    function BeatBoxController(beats) {
        // Beats des Users
        this.beats = beats;
        // der aktuelle Beat des Users
        this.currentBeat = null;
        // Zustand der BeatBox Machine: true oder false
        this.isPlaying = false;
        // Startzeit der gerade stattfindenden Abspielens dss Beats
        this.startTime;
        // die aktuell abzuspielende Sechzehntelnote
        this.current16thNote;
        // Tempo des Beats
        this.tempo = 120.0;
        // Zeit in Millisekunden, nach deren Ablauf die Funktion scheduler() wiederholend ausgeführt wird
        this.lookahead = 25.0;
        // Pufferzeit, die in der Funktion scheduler() zur Prüfung,ob die nächste Sechzehntelnote
        // abzuspielen ist, verwendet wird
        this.scheduleAheadTime = 0.1;
        // Zeitpunkt des Abspielens der nächsten Sechzehntelnote
        this.nextNoteTime = 0.0;
        // Web Worker zum regelmäßigen abfeuern von einem Zeitereignis
        this.timerWorker = null;
        // Array zum Speichern die binären Sound-Daten, die dem Anwender zur Verfügung stehen
        this.soundBufferArray;
        // Controller zum Verwalten der Lautstärke und Filter
        this.gainNodeController = null;


        // Funktion zum Abspielen des Beats
        this.playBeat = function () {
            this.isPlaying = !this.isPlaying;

            if (this.isPlaying) {
                // Setzen der aktuellen Sechzehntelnote auf 0
                this.current16thNote = 0;
                this.nextNoteTime = Utils.audioContext.currentTime;
                this.timerWorker.postMessage("start");
                return "stop";
            } else {
                this.timerWorker.postMessage("stop");
                return "play";
            }
        };

        // Funktion, zum Stoppen des Abspielens
        this.stopPlaying = function () {
            this.isPlaying = false;
            this.timerWorker.postMessage("stop");
        };

        // Funktion zum Speichern des Beats
        this.saveBeat = function () {
            this.currentBeat.save();
        };

        // Funtkion zum Setzen des aktuellen Beats
        this.setCurrentBeat = function () {
            if (this.beats.length > 0) {
                this.currentBeat = this.beats.last();
            } else {
                this.currentBeat = new Beat();
            }
        };

        // Funktion, zur Initialisierung des BeatBoxControllers
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
                    // var bars = _this.currentBeat.get("bars");
                    //
                    // bars.forEach(function (bar) {
                    //     bar.sound = _this.soundBufferArray[0];
                    // });

                    // Bar.prototype.sound = soundBufferArray[0];
                    // bars[2].sound = soundBufferArray[1];
                }
            );

            //Sounds laden
            bufferLoader.load();

            // Web Worker initialisieren
            this.timerWorker = new Worker("js/beatbox-app/views/helpers/beatboxworker.js");

            // Event Handler setzen
            this.timerWorker.onmessage = function (e) {
                if (e.data == "tick") {
                    console.log("tick!");
                    // nach einem jedem Schlag des timeWorkers die Funktion scheduler() aufrufen()
                    _this.scheduler();
                }
                else
                    console.log("message: " + e.data);
            };

            this.timerWorker.postMessage({"interval": this.lookahead});
        };

        // Funktion zur Prüfung, ob zur nächsten Sechzehntelnote gewechselt werden soll
        this.scheduler = function () {

            // true, falls zur nächsten Sechzehntelnote gewechselt werden soll
            while (this.nextNoteTime < Utils.audioContext.currentTime + this.scheduleAheadTime) {
                this.showPlayedNote();
                this.scheduleNote(this.current16thNote, this.nextNoteTime);
                this.nextNote();
            }
        };

        // Prüfen, in welchen Takten die aktuelle Sechzehntelnote gesetzt ist
        // und anschließend die gesetzten Sounds abspielen
        this.scheduleNote = function (beatNumber, time) {
            var _this = this;
            var notesToPlay = new Array(this.currentBeat.get("bars").length);
            var i = 0;
            var playing = false;
            this.currentBeat.get("bars").forEach(function (bar) {
                if (bar.notes[_this.current16thNote]) {
                    notesToPlay[i] = ({
                        sound: _this.soundBufferArray[bar.sound],
                        // sound: bar.sound,
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

        // Funktion zum Berechnen und Setzen des Zeitpunktes des Abspielens der nächsten Sechzehntelnote
        this.nextNote = function () {
            var secondsPerBeat = 60.0 / this.tempo;
            this.nextNoteTime += 0.25 * secondsPerBeat;
            this.current16thNote++;
            if (this.current16thNote == 16) {
                this.current16thNote = 0;
            }
        };

        // Funktion zum Abspielen eines Sounds
        this.playSound = function (buffer) {
            var source = Utils.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(Utils.audioContext.destination);
            source.start();
        };

        // Funktion zum Setzen oder Entfernen der Note mit der Nummer noteNumber
        // im Takt mit der Nummer barNumber

        this.toggleNote = function (barNumber, noteNumber) {
            var bar = this.currentBeat.get("bars")[parseInt(barNumber)];
            bar.notes[noteNumber - 1] = !(bar.notes[noteNumber - 1]);
            // den aktuellen Wert der Note - true or false -  zurückliefern
            return bar.notes[noteNumber - 1];
        };

        // diese Funktion weist dem Button, der die aktuelle Sechzehntelnote darstellt, den Wert played zu
        this.showPlayedNote = function () {
            var noteButtons = $('.noteBtn');
            $(noteButtons).attr('value', '');
            $(noteButtons)[this.current16thNote].value = 'played';
        };

        // Funktion zum Ändern der Lautstärke des Takts mit der Nummer barIndex auf den neuen Wert volumeValue
        this.changeVolume = function (barIndex, volumeValue) {
            this.currentBeat.get("bars").volume = volumeValue;
            this.gainNodeController.adjustVolume(barIndex, volumeValue / 100);
        };

        this.init();
    }

    return BeatBoxController;
});