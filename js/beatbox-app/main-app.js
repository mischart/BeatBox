/**
 * main-app
 *
 * @module main-app.js
 */

define([
        'jquery',
        'underscore',
        'backbone',
        'localstorage'
    ],
    function ($, _, Backbone) {
        var init = function () {

            if (!window.localStorageInstance) window.localStorageInstance = new Backbone.LocalStorage("beatbox-backbone");
            require(['app/router'], function (Router) {
                // Router initialisieren
                Router.init();
            })
        };

        return {
            init: init
        };
    });