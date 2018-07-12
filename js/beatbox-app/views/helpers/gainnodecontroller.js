define([
    'app/views/helpers/utils'
], function (Utils) {
    function GainNodeController(numberOfBars) {
        this.mainGainNode = Utils.audioContext.createGain();
        this.volumeGainNodes = null;

        // Gain Objekte, die Audiosignale an Konvolver-Objekte
        // weitergeben
        this.convolverGains = null;
        // Konvolver-Objekte zur Konvolution, mit deren Hilfe
        // Effekte erzeugt werden
        this.convolvers = null;
        // Kompressor-Objekte zum stufenlosen Steuern der Effekte
        this.compressors = null;
        this.soundSources = null;
        this.numberOfBars = numberOfBars;


        // Function zum Erzeugen von volumeGainNodes, convolverGains, Konvolvern und Kompressoren
        this.createVolumeAndEffectNodes = function (numberOfBars) {
            this.convolverGains = new Array(numberOfBars);
            this.convolvers = new Array(numberOfBars);
            this.compressors = new Array(numberOfBars);
            this.volumeGainNodes = new Array(numberOfBars);
            for (var i = 0; i < numberOfBars; i++) {
                this.convolverGains[i] = Utils.audioContext.createGain();
                this.convolvers[i] = Utils.audioContext.createConvolver();
                this.compressors[i] = Utils.audioContext.createDynamicsCompressor();
                this.volumeGainNodes[i] = Utils.audioContext.createGain();

                this.convolverGains[i].connect(this.convolvers[i]);
                this.convolvers[i].connect(this.compressors[i]);
                this.compressors[i].connect(this.volumeGainNodes[i]);
                this.volumeGainNodes[i].connect(this.mainGainNode);
            }
            return this.volumeGainNodes;
        };

        this.connectSourceToAndPlay = function () {
            for (var i = 0; i < this.soundSources.length; i++) {
                if (this.soundSources[i] != null) {
                    // this.soundSources[i].connect(this.volumeGainNodes[i]);
                    this.soundSources[i].connect(this.convolverGains[i]);
                    this.soundSources[i].connect(this.compressors[i]);
                    this.soundSources[i].start();
                }
            }
        };

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


        this.connectVolumeNodeGainTo = function () {
            var _this = this;
            this.volumeGainNodes.forEach(function (volumeGainNode) {
                volumeGainNode.connect(_this.mainGainNode);
            });
        };

        this.init = function (numberOfBars) {
            this.mainGainNode.connect(Utils.audioContext.destination);
            this.mainGainNode.gain.value = 1;
            this.createVolumeAndEffectNodes(numberOfBars);
            // this.connectVolumeNodeGainTo();
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
