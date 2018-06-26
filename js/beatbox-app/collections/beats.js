define([
    'underscore',
    'backbone',
    'localstorage',
    'app/models/beat'
], function (_, Backbone, LocalStorage, BeatModel) {
    var Beats = Backbone.Collection.extend({
        model: BeatModel,
        localStorage: window.localStorageInstance
    });
    return Beats;
});