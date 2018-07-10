define([
    'underscore',
    'backbone',
    'localstorage',
    'app/models/bar'

], function (_, Backbone, LocalStorage, Bar) {
    var Beat = Backbone.Model.extend({
        localStorage: window.localStorageInstance,
        defaults: {
            name: "anonim",
            tempo: 120,
            volume: 100,
            bars: createDefaultBarSet()
        }
    });

    function createDefaultBarSet() {
        var barArray = new Array(8);
        for (var i = 0; i < barArray.length; i++) {
            barArray[i] = new Bar();
        }
        return barArray;
    }

    return Beat;
});