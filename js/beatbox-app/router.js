/**
 * router zum Navigieren zwischen den Unterseiten und Views
 *
 * @module router.js
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'app/views/mainView'

], function ($, _, Backbone, MainView) {
    var mainView;
    var Router = Backbone.Router.extend({
        // Routen mit dem Pfad und der zugehörigen Aktion definieren
        routes: {
            '': 'main'
        },

        // Funktion main() zum Aufbau  von mainView
        main: function (beatID) {
            console.log('Backbone routed to MainView - template');
            if (mainView) mainView.kill();
            mainView = new MainView({router: this, beatID: beatID});
        }
    });

    var init = function () {
        var router = new Router();

        router.on('route:main', function (page) {
            console.log('Backbone routed to MainView - template');
            if (mainView) mainView.kill();
            mainView = new MainView({router: router, beatID: null});
        });
        Backbone.history.start();
    };

    return {
        init: init
    };
});