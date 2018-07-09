define([
    'app/views/helpers/utils'
], function (Utils) {
    function GainNodeController(numberOfBars) {
        this.mainGainNode = Utils.audioContext.createGain();
        this.volumeGainNodes = null;
        this.soundSources = null;
        this.numberOfBars = numberOfBars;

        this.createVolumeGainNodes = function (numberOfBars) {
            var gainNodeArray = new Array(numberOfBars);
            for (var i = 0; i < gainNodeArray.length; i++) {
                gainNodeArray[i] = Utils.audioContext.createGain();
            }
            return gainNodeArray;
        };

        this.stopAndDisconnectSources = function () {
            if (this.soundSources != null) {
                this.soundSources.forEach(function (source) {
                    if (source != null) {
                        source.disconnect();
                        source.stop();
                    }
                });
                // for (var i = 0; i < this.soundSources.length; i++) {
                //     this.soundSources[i].stop();
                //     this.soundSources[i].disconnect();
                // }
            }

        };


        this.connectSourceToAndPlay = function () {
            for (var i = 0; i < this.soundSources.length; i++) {
                if (this.soundSources[i] != null) {
                    this.soundSources[i].connect(this.volumeGainNodes[i])
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
            this.volumeGainNodes = this.createVolumeGainNodes(numberOfBars);
            this.connectVolumeNodeGainTo();
        };

        // Funktion zur Einstellung der Lautstärke des Takts mit der Nummer barIndex
        this.adjustBarVolume = function (barIndex, volumeValue) {
            this.volumeGainNodes[barIndex].gain.value = volumeValue;
        };

        // Funktion zur Einstellung der gesamten Lautstärke der BeatBox Maschine
        this.adjustMainVolume = function (volumeValue) {
            this.mainGainNode.gain.value = volumeValue;
        };

        this.init(numberOfBars);
    }

    return GainNodeController;
});
