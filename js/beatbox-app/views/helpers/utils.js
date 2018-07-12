/**
 * Modul utils mit globalen Variablen als Singeltone
 *
 * @module utils.js
 */

define([], function () {
    var instance = null;

    function Utils() {
        if (instance !== null) {
            throw new Error("Utils is initialized");
        }

        this.initialize();
    }

    Utils.prototype = {
        initialize: function () {
            this.audioContext = new AudioContext();
        }
    };

    Utils.getInstance = function () {
        if (instance === null) {
            instance = new Utils();
        }
        return instance;
    };

    return Utils.getInstance();
});
