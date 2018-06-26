requirejs.config({
    //set default path to external libraries
    baseUrl: "js/lib",
    paths: {
        //set path to application files (relative to baseURL)
        app: '../beatbox-app',
        //set path to template files
        templates: '../../templates',

        //external libraries
        jquery: [
            '//ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min', // load from CDN
            'jquery' //local fallback
        ],
        //set libraries alias (placed in baseURL folder)
        underscore: 'underscore-min',
        backbone: 'backbone',
        localstorage: "backbone.localStorage"
    }
});