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
    'app/views/helpers/gainnodecontroller'
], function ($, Beat, BufferLoader, Utils, GainNodeController) {
    function BeatBoxController(beats, beatID) {
        // gespeichterte Beats des Users
        this.beats = beats;
        // der aktuelle Beat des Users
        this.currentBeat = null;
        // Zustand der BeatBox Machine: true oder false
        this.isPlaying = false;
        // Startzeit der gerade stattfindenden Abspielens dss Beats
        this.startTime;
        // die aktuell abzuspielende Sechzehntelnote
        this.current16thNote;
        // Zeit in Millisekunden, nach deren Ablauf die Funktion scheduler() wiederholend ausgeführt wird
        this.lookahead = 25.0;
        // Pufferzeit, die in der Funktion scheduler() zur Prüfung, ob die nächste Sechzehntelnote
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
                // Zeitpunkt der nächsten Sechzehntelnote
                this.nextNoteTime = Utils.audioContext.currentTime;
                // start Message senden
                this.timerWorker.postMessage("start");
            } else {
                // stop Message senden
                this.timerWorker.postMessage("stop");
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
        this.setCurrentBeat = function (beatID) {
            // falls eine BeatID vorhanden ist
            if (beatID != null) {
                this.currentBeat = this.beats.get(beatID);
            } else { // falls keine BeatID vorhanden ist (z.B. wenn die Collection keine Beats enthält
                // oder die Anwendung gerade gestartet wurde)
                if (this.beats.length > 0) {
                    // der letzte Beat der Collection der Variablen currentBeat zuweisen
                    this.currentBeat = this.beats.last();
                } else {
                    // einen neuen Beat initialisieren, falls die Collection leer ist
                    this.currentBeat = new Beat();
                    this.currentBeat.set("bars", this.currentBeat.createDefaultBarSet());
                }
            }
        };

        // Funktion, zur Initialisierung des BeatBoxControllers
        this.init = function () {
            // Initialisierung von gainNodeController, der zum Abspielen von Sound-Daten und
            // zur Einstellung von Effekte und Laustärke dient
            this.gainNodeController = new GainNodeController(this.currentBeat.get("bars").length);
            // Laustärke initialisieren
            this.initializeVolume();
            // Effekte initialisieren
            this.initializeEffects();
            var _this = this;

            // Web Worker zum Empfang von regelmäßigen Zeitereignissen initialisieren
            // basierend auf den Quellen: https://www.html5rocks.com/en/tutorials/audio/scheduling/
            // https://github.com/cwilso/metronome/blob/master/js/metronomeworker.js
            this.timerWorker = new Worker("js/beatbox-app/views/helpers/beatboxworker.js");

            // Event Handler zum Empfang von regelmäßigen Zeitereignissen setzen
            this.timerWorker.onmessage = function (e) {
                if (e.data == "tick") {
                    console.log("tick!");
                    // nach einem jedem Empfang des Zeitereignisses die Funktion scheduler() aufrufen()
                    _this.scheduler();
                }
                else
                    console.log("message: " + e.data);
            };

            // den Wert der Variablen lookahead senden
            // (nach jedem Ablauf von lookahead feuert der beatboxworker ein Zeitereignis ab)
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
        // und anschließend die gesetzten Sounds an gainNodeController übergeben
        // der die übergebenen Sound-Daten abspielt
        this.scheduleNote = function (beatNumber, time) {
            var _this = this;
            var notesToPlay = new Array(this.currentBeat.get("bars").length);
            var i = 0;
            var playing = false;
            this.currentBeat.get("bars").forEach(function (bar) {
                if (bar.notes[_this.current16thNote]) {
                    notesToPlay[i] = ({
                        sound: _this.soundBufferArray[bar.sound]
                    });
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
            var secondsPerBeat = 60.0 / this.currentBeat.get("tempo");
            this.nextNoteTime += 0.25 * secondsPerBeat;
            this.current16thNote++;
            if (this.current16thNote == 16) {
                this.current16thNote = 0;
            }
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
        this.changeVolumeOfBar = function (barIndex, volumeValue) {
            this.currentBeat.get("bars")[barIndex].volume = volumeValue;
            this.gainNodeController.adjustBarVolume(barIndex, volumeValue / 100);
        };

        // Funktion zum Ändern der Lautstärke der gesamten BeatBox Maschine
        this.changeVolume = function (volumeValue) {
            this.currentBeat.set("volume", volumeValue);
            this.gainNodeController.adjustMainVolume(volumeValue / 100);
        };

        // Funktion zur Initialisierung der Lautstärke der gesamten BeatBox Maschine
        // sowie der einzelnen Takte
        this.initializeVolume = function () {
            var currentMainVolume = this.currentBeat.get("volume");
            this.gainNodeController.adjustMainVolume(currentMainVolume / 100);
            var bars = this.currentBeat.get("bars");
            for (var i = 0; i < bars.length; i++) {
                this.gainNodeController.adjustBarVolume(i, bars[i].volume / 100);
            }

        };

        // Funktion zur Initialisierung der Sound Effekte der einzelnen Takte
        this.initializeEffects = function () {
            var bars = this.currentBeat.get("bars");
            for (var i = 0; i < bars.length; i++) {
                var effectIndex = bars[i].effect;
                var effectLevel = bars[i].effectLevel;
                this.gainNodeController.adjustEffect(i, this.soundBufferArray[effectIndex], effectLevel / 100);
            }

        };

        // Funktion zum Ändern des Sounds in einem Takt
        this.changeBarSound = function (barIndex, soundIndex) {
            var bars = this.currentBeat.get("bars");
            bars[barIndex].sound = soundIndex;
        };

        // Funktion zum Ändern des Effekts in einem Takt
        this.changeBarEffect = function (barIndex, effectIndex) {
            var bars = this.currentBeat.get("bars");
            bars[barIndex].effect = effectIndex;
            this.gainNodeController.adjustEffect(barIndex, this.soundBufferArray[effectIndex], null);
        };

        // Funktion zum Ändern des Effektpegels in einem Takt
        this.changeBarEffectLevel = function (barIndex, effectLevel) {
            var bars = this.currentBeat.get("bars");
            bars[barIndex].effectLevel = effectLevel;
            this.gainNodeController.adjustEffect(barIndex, null, effectLevel / 100);
        };

        // Funktion zur Einstellung des Beattempos
        this.adjustTempo = function (tempo) {
            this.currentBeat.set("tempo", tempo);
        };

        // Funktion zur Erstellung eines neuen Beats
        this.createNewBeat = function () {
            this.currentBeat = new Beat();
            this.currentBeat.set("bars", this.currentBeat.createDefaultBarSet());
        };

        this.setCurrentBeat(beatID);
    }

    return BeatBoxController;
});