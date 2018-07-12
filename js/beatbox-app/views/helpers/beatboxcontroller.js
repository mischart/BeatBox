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
            this.initializeVolume();

            var _this = this;
            var bufferLoader = new BufferLoader(
                Utils.audioContext,
                [
                    //     This application uses these sounds below from freesound:


                    // kick
                    'sounds/kick/40604__pestilenza__kick-11.wav', // author / user http://freesound.org/people/pestilenza/
                    'sounds/kick/42028__psycho-boomer__hard-kick1.wav', // author / user http://freesound.org/people/psycho-boomer/
                    'sounds/kick/171104__dwsd__kick-gettinglaid.wav', // author / user http://freesound.org/people/dwsd/
                    'sounds/kick/183097__dwsd__bd-doitlive.wav', // author / user http://freesound.org/people/dwsd/
                    'sounds/kick/344761__waveplay__punchy-trance-kick-5.wav', // author / user http://freesound.org/people/waveplay/
                    'sounds/kick/346968__giomilko__kick-001.wav', // author / user http://freesound.org/people/giomilko/
                    'sounds/kick/368648__darealwollen__kick-01.wav', // author / user http://freesound.org/people/darealwollen/
                    //snare
                    'sounds/snare/100396__zgump__snare-04.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/snare/165208__rhythmpeople__rpeople-snare2.wav', // author / user http://freesound.org/people/rhythmpeople/
                    'sounds/snare/212208__alexthegr81__tapesnare-15.wav', // author / user http://freesound.org/people/alexthegr81/
                    'sounds/snare/270156__theriavirra__04c-snare-smooth-cymbals-snares.wav', // author / user http://freesound.org/people/theriavirra/
                    'sounds/snare/387186__alexiero-1__ai-snare-20.wav', // author / user http://freesound.org/people/alexiero-1/
                    'sounds/snare/410514__inspectorj__snare-drum-single-hit-a-h1.wav', // author / user http://freesound.org/people/inspectorj/
                    // //hihat
                    'sounds/hihat/55230__dolfeus__zome-7hithatstereo.wav', // author / user http://freesound.org/people/dolfeus/
                    'sounds/hihat/57527__dolfeus__catbeat-hit.wav', // author / user http://freesound.org/people/dolfeus/
                    'sounds/hihat/96140__zgump__zg-hat-01.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/hihat/269720__ianstargem__electronic-closed-high-hat-1.wav', // author / user http://freesound.org/people/ianstargem/
                    'sounds/hihat/404889__gnuoctathorpe__hi-hat3.wav', // author / user http://freesound.org/people/gnuoctathorpe/
                    'sounds/hihat/404890__gnuoctathorpe__hi-hat2.wav', // author / user http://freesound.org/people/gnuoctathorpe/
                    // //bass
                    'sounds/bass/11741__medialint__bassis-big-bass-c2.wav', // author / user http://freesound.org/people/medialint/
                    'sounds/bass/75228__zgump__bass-0101.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/bass/89264__smokum__bass-a2.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/bass/89265__smokum__bass-a3.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/bass/115525__ongitak__bass-stab-11.wav', // author / user http://freesound.org/people/ongitak/
                    'sounds/bass/209943__veiler__bass-16b.wav', // author / user http://freesound.org/people/veiler/
                    'sounds/bass/8521__pitmusic__tb3-bass-02.wav', // author / user http://freesound.org/people/pitmusic/
                    'sounds/bass/89263__smokum__bassdown-d3.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/bass/122422__anillogic__grungebass-a1.wav', // author / user http://freesound.org/people/anillogic/

                    // //others
                    'sounds/others/11741__medialint__bassis-big-bass-c2.wav', // author / user http://freesound.org/people/medialint/
                    'sounds/others/26956__xinaesthete__bsoft2.wav', // author / user http://freesound.org/people/xinaesthete/
                    'sounds/others/28469__simmfoc__blip-1.wav', // author / user http://freesound.org/people/simmfoc/
                    'sounds/others/75228__zgump__bass-0101.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/others/89264__smokum__bass-a2.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/others/89265__smokum__bass-a3.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/others/103015__zgump__el-bass-01.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/others/103016__zgump__el-bass-02.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/others/115525__ongitak__bass-stab-11.wav', // author / user http://freesound.org/people/ongitak/
                    'sounds/others/161841__antistatikk__balloon-bass-03.wav', // author / user http://freesound.org/people/antistatikk/
                    'sounds/others/164699__deleted-user-2195044__sound5a.wav', // author / user https://freesound.org/people/deleted_user_2195044/
                    'sounds/others/209943__veiler__bass-16b.wav', // author / user http://freesound.org/people/veiler/
                    'sounds/others/249300__suntemple__access-denied.wav', // author / user http://freesound.org/people/suntemple/
                    'sounds/others/253178__suntemple__retro-jump-sfx.wav', // author / user http://freesound.org/people/suntemple/
                    'sounds/others/264512__dexus5__geiger1.wav', // author / user http://freesound.org/people/dexus5/
                    'sounds/others/321104__nsstudios__blip2.wav', // author / user http://freesound.org/people/nsstudios/
                    'sounds/others/385927__pol__s002-lap-complete-signal.wav', // author / user http://freesound.org/people/pol/
                    'sounds/others/398088__gamezger__quack.wav', // author / user http://freesound.org/people/gamezger/
                    'sounds/others/405546__raclure__loading-chime.wav', // author / user http://freesound.org/people/raclure/
                    'sounds/others/414888__mattix__8bit-laser-shot-04.wav', // author / user http://freesound.org/people/mattix/
                    //effects (Sounds, die Impulsantworten bilden)
                    'sounds/effects/room.mp3', // quelle: http://audiodesign.raffaseder.net/html/Kap2_6.htm
                    'sounds/effects/cathedral.mp3', // quelle: http://audiodesign.raffaseder.net/html/Kap2_6.htm
                    'sounds/effects/toilet.mp3', // quelle: http://audiodesign.raffaseder.net/html/Kap2_6.htm
                    'sounds/effects/factoryHall.wav', // quelle: https://fokkie.home.xs4all.nl/IR.htm
                    'sounds/effects/smallChurch.wav' // quelle: https://fokkie.home.xs4all.nl/IR.htm



                ], function (bufferList) {
                    //geladene Sounds abspeichern
                    _this.soundBufferArray = bufferList;
                    _this.initializeEffects();

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
                        sound: _this.soundBufferArray[bar.sound]
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
            var secondsPerBeat = 60.0 / this.currentBeat.get("tempo");
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
        },

            // Funktion zur Einstellung des Beattempos
        this.adjustTempo = function (tempo) {
            this.currentBeat.set("tempo", tempo);
        };

        this.init();
    }

    return BeatBoxController;
});