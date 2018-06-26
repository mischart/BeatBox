define([
    'jquery',
    'underscore',
    'backbone',
    'app/collections/beats',
    'text!templates/main-template.html', //load HTML Template with Require.js text! plugin,
    'app/views/helpers/beatboxcontroller'
], function ($, _, Backbone, Beats, template, BeatBoxController) {
    console.log('require main view');
    var MainView = Backbone.View.extend({
        el: $('#beatbox-app'),
        initialize: function (options) {
            this.options = options;
            this.beatBoxController = null;
            var beats = new Beats();
            var _this = this;


            beats.fetch({
                success: function () {
                    _this.beatBoxController = new BeatBoxController(beats);
                    _this.render();
                }
            });


            return this;
        },
        events: {
            'click #playButton': 'play',
            'click #stopButton': 'stop',
            'click #saveButton': 'save',
            'click #deleteButton': 'delete',
            'click .beatBtn': 'onBeatButtonClick',
            'input .barVolume': 'changeBarVolume'

        },
        render: function () {
            var compiledTemplate = _.template(template);      //template is the loaded HTML template
            var t = compiledTemplate({bars: this.beatBoxController.currentBeat.get("bars")});
            this.$el.html(t);
            return this;
        },

        kill: function () {
            this.stopListening();
            this.undelegateEvents();
        },


        play: function () {
            this.beatBoxController.playBeat();
        },

        stop: function () {
            this.beatBoxController.stopPlaying();
        },

        save: function () {
            this.beatBoxController.saveBeat();
        },

        delete: function () {
            this.stop();
            var _this = this;
            this.beatBoxController.currentBeat.destroy({
                success: function () {
                    // TODO
                    _this.options.router.navigate('', {trigger: true});
                }
            });

        },


        onBeatButtonClick: function (e) {
            var beatBtn = e.target;
            var barNumber = beatBtn.parentNode.id;
            var noteNumber = this.getNoteNumber(beatBtn.classList);
            var set = this.beatBoxController.toggleNote(barNumber, noteNumber);
            if (set) {
                beatBtn.value = "set";
            } else {
                beatBtn.value = "unset";
            }
        },

        changeBarVolume: function (e) {
            var volumeId = e.target.id;
            var barIndex = volumeId.replace('volume', '');
            var value = parseInt(e.target.value);
            this.beatBoxController.changeVolume(barIndex, value);
        },

        getNoteNumber: function (classLst) {
            if (classLst.contains("1")) {
                return 1;
            } else if (classLst.contains("2")) {
                return 2;
            } else if (classLst.contains("3")) {
                return 3;
            } else if (classLst.contains("4")) {
                return 4;
            } else if (classLst.contains("5")) {
                return 5;
            } else if (classLst.contains("6")) {
                return 6;
            } else if (classLst.contains("7")) {
                return 7;
            } else if (classLst.contains("8")) {
                return 8;
            } else if (classLst.contains("9")) {
                return 9;
            } else if (classLst.contains("10")) {
                return 10;
            } else if (classLst.contains("11")) {
                return 11;
            } else if (classLst.contains("12")) {
                return 12;
            } else if (classLst.contains("13")) {
                return 13;
            } else if (classLst.contains("14")) {
                return 14;
            } else if (classLst.contains("15")) {
                return 15;
            } else if (classLst.contains("16")) {
                return 16;
            } else return 0;
        }
    });
    return MainView;
});