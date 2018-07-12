/**
 * GainNodeController zum Abspielen von Sound-Daten
 * sowie zur Einstellung von Soundeffekten und Lautstärke
 *
 *
 * @module gainnodecontroller.js
 */

define([
    'app/views/helpers/utils'
], function (Utils) {
    function GainNodeController(numberOfBars) {

        // Gain-Objekt, das direkt mit der Destination des Audio Contexts zu verbinden ist
        this.mainGainNode = Utils.audioContext.createGain();
        //Variable , der ein Array mit Gain-Objekten zur Einstellung der Lautstärke eines jeden Takts zuzuweisen ist
        this.volumeGainNodes = null;
        // Gain Objekte, die Audiosignale an Konvolver-Objekte weitergeben
        this.convolverGains = null;
        // Konvolver-Objekte zur Konvolution, mit deren Hilfe Effekte erzeugt werden
        this.convolvers = null;
        // Kompressor-Objekte zum stufenlosen Steuern der Effekte
        this.compressors = null;
        // Variable mit Sound-Daten der Takte
        this.soundSources = null;
        // Anzahl der Takte
        this.numberOfBars = numberOfBars;


        // Function zum Erzeugen von volumeGainNodes, convolverGains, Konvolvern und Kompressoren
        this.createVolumeAndEffectNodes = function (numberOfBars) {
            // Arrays erzeugen
            this.convolverGains = new Array(numberOfBars);
            this.convolvers = new Array(numberOfBars);
            this.compressors = new Array(numberOfBars);
            this.volumeGainNodes = new Array(numberOfBars);
            // Index i entspricht dem Index des Taktes des Beats
            for (var i = 0; i < numberOfBars; i++) {
                // entsprechende Knoten erzeugen
                this.convolverGains[i] = Utils.audioContext.createGain();
                this.convolvers[i] = Utils.audioContext.createConvolver();
                this.compressors[i] = Utils.audioContext.createDynamicsCompressor();
                this.volumeGainNodes[i] = Utils.audioContext.createGain();

                // Knoten miteinander verbinden
                this.convolverGains[i].connect(this.convolvers[i]);
                this.convolvers[i].connect(this.compressors[i]);
                this.compressors[i].connect(this.volumeGainNodes[i]);
                this.volumeGainNodes[i].connect(this.mainGainNode);
            }
            return this.volumeGainNodes;
        };

        // Sound-Daten mit Knoten verbinden und abspielen
        this.connectSourceToAndPlay = function () {
            for (var i = 0; i < this.soundSources.length; i++) {
                if (this.soundSources[i] != null) {
                    this.soundSources[i].connect(this.convolverGains[i]);
                    this.soundSources[i].connect(this.compressors[i]);
                    this.soundSources[i].start();
                }
            }
        };

        // Funktion zum Abspielen der Sound-Daten
        this.playSound = function (noteParameters) {
            this.soundSources = new Array(this.numberOfBars);
            for (var i = 0; i < noteParameters.length; i++) {
                if (noteParameters[i] != null) {
                    this.soundSources[i] = (Utils.audioContext.createBufferSource());
                    this.soundSources[i].buffer = noteParameters[i].sound;
                }
            }
            this.connectSourceToAndPlay();

        };

        // Initialisierungsfunktion
        this.init = function (numberOfBars) {
            this.mainGainNode.connect(Utils.audioContext.destination);
            this.mainGainNode.gain.value = 1;
            this.createVolumeAndEffectNodes(numberOfBars);
        };

        // Funktion zur Einstellung der Lautstärke des Takts mit der Nummer barIndex
        this.adjustBarVolume = function (barIndex, volumeValue) {
            this.volumeGainNodes[barIndex].gain.value = volumeValue;
        };

        // Funktion zur Einstellung der gesamten Lautstärke der BeatBox Maschine
        this.adjustMainVolume = function (volumeValue) {
            this.mainGainNode.gain.value = volumeValue;
        };

        // Funktion zur Einstellung des Effekts und Effektpegels in dem Takt mit der Nummer barIndex
        this.adjustEffect = function (barIndex, impulseResponseSound, effectLevel) {
            if (barIndex != null && impulseResponseSound != null) {
                this.convolvers[barIndex].buffer = impulseResponseSound;
            }

            if (barIndex != null && effectLevel != null) {
                this.convolverGains[barIndex].gain.value = effectLevel;
            }

        };

        this.init(numberOfBars);
    }

    return GainNodeController;
});
