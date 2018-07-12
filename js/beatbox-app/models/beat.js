/**
 * Model
 *
 * @module beat.js
 */

define([
    'underscore',
    'backbone',
    'localstorage',
    'app/models/bar'

], function (_, Backbone, LocalStorage, Bar) {
    var Beat = Backbone.Model.extend({
        localStorage: window.localStorageInstance,
        defaults: {
            // Name des Beats
            name: "anonim",
            // Tempo des Beats
            tempo: 120,
            // Lautstärke des Beats
            volume: 100,
            // Takte des Beats
            bars: null
        },

        // Funktion zur Erstellung eines Arrays mit 8 Takten mit default Werten
        createDefaultBarSet: function () {
            var barArray = new Array(8);
            for (var i = 0; i < barArray.length; i++) {
                barArray[i] = new Bar();
        }
            return barArray;
        }

    });


    return Beat;
});