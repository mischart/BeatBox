define([
    'jquery',
    'underscore',
    'backbone',
    'app/views/mainView'

], function ($, _, Backbone, MainView) {
    var mainView;
    var Router = Backbone.Router.extend({
        routes: {
            '': 'main'
        },

        main: function () {
            if (mainView) mainView.kill();
            mainView = new MainView({router: this});
        },
    });

    var init = function () {
        var router = new Router();

        router.on('route:main', function (page) {
            console.log('Backbone routed to MainView - template');
            if (mainView) mainView.kill();
            mainView = new MainView({router: router});
        });
        Backbone.history.start();
    };

    return {
        init: init
    };
});