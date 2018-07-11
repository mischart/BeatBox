/**
 * mainView zur Darstellung der BeatBox Maschine
 *
 * @module mainView.js
 */


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
            this.beatBoxController = null;   // beatBoxController zum Verwalten des aktuellen Beats
            var beats = new Beats(); // Collections, d.h. gespeicherte Beats des Users
            var _this = this;


            beats.fetch({
                success: function () {
                    _this.beatBoxController = new BeatBoxController(beats);
                    _this.render();
                }
            });


            return this;
        },
        //  Event Handler setzen
        events: {
            'click #playButton': 'play',
            'click #stopButton': 'stop',
            'click #saveButton': 'save',
            'click #deleteButton': 'delete',
            'click .beatBtn': 'onBeatButtonClick',
            'input .barVolume': 'changeBarVolume',
            'input #volumeIn': 'changeMainVolume',
            'input #tempoIn': 'changeTempo',
            'change .soundSelect': 'changeSound',
            'input .effectSelect': 'changeEffect',



        },

        // Funktion zum Rendern der mainView
        render: function () {
            var compiledTemplate = _.template(template);      //template is the loaded HTML template
            //var t = compiledTemplate({bars: this.beatBoxController.currentBeat.get("bars")});
            var t = compiledTemplate({beat: this.beatBoxController.currentBeat});
            this.$el.html(t);
            this.setSelectedBarSound(this.beatBoxController.currentBeat.get("bars"));
            this.setSelectedEffect(this.beatBoxController.currentBeat.get("bars"));
            return this;
        },

        //  Funktion zur Trennung von Event Listenern
        kill: function () {
            this.stopListening();
            this.undelegateEvents();
        },

        // Event Handler zum Abspielen des Beats
        play: function () {
            this.beatBoxController.playBeat();
        },

        // Event Handler zum Stoppen des Abspielens
        stop: function () {
            this.beatBoxController.stopPlaying();
        },

        // Event Handler zum Abspeichern des Beats
        save: function () {
            this.beatBoxController.saveBeat();
        },

        // Event Handler zum Löschen des Beats
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

        // Event Handler zum Setzen oder Enfernen einer Sechzehntelnote
        onBeatButtonClick: function (e) {
            // angeklickter Button, der eine Sechzehntelnote repräsentiert
            var beatBtn = e.target;
            // Takt, zu dem die angeklickte Sechzehntelnote gehört
            var barNumber = beatBtn.parentNode.id;
            // Nummer der angeklickten Sechzehntelnote (von 1 bis 16)
            var noteNumber = this.getNoteNumber(beatBtn.classList);
            // Prüfen, ob die Sechzehntelnote gesetzt oder entfernt werden soll
            var set = this.beatBoxController.toggleNote(barNumber, noteNumber);
            if (set) {
                beatBtn.value = "set";
            } else {
                beatBtn.value = "unset";
            }
        },

        // Event Handler zum Ändern der Lautstärke eines Takts
        changeBarVolume: function (e) {
            var volumeId = e.target.id;
            var barIndex = volumeId.replace('volume', '');
            var value = parseInt(e.target.value);
            this.beatBoxController.changeVolumeOfBar(barIndex, value);
        },

        // Event Handler zum Ändern der Lautstärke des gesamten Beats
        changeMainVolume: function (e) {
            var value = parseInt(e.target.value);
            this.beatBoxController.changeVolume(value);
        },

        // Eventhandler zum Ändern des Tempos
        changeTempo: function (e) {
            var value = parseInt(e.target.value);
            if (value >= parseInt(e.target.min) && value <= parseInt(e.target.max)) {
                this.beatBoxController.adjustTempo(value);
            }
        },

        // Eventhandler zum Ändern des Sounds in einem Takt
        changeSound: function (e) {
            var soundSelectId = e.target.id;
            var barIndex = soundSelectId.replace('sound', '');
            var soundIndex = e.target.options[e.target.selectedIndex].value;
            this.beatBoxController.changeBarSound(barIndex, soundIndex);

        },

        // Funktion, die die zugeordnete laufende Nummer einer Sechzehntelnote zurückgibt
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
        },

        // Funktion zum Setzen des Attributs selected für entsprechende option-Elemente,
        // die ausgewählten Sounds in den einzelnen Takten darstellen
        setSelectedBarSound: function (bars) {
            var i = 0;
            var soundSelectElements = $('select.soundSelect');
            bars.forEach(function (bar) {
                var soundSelect = soundSelectElements[i];
                var soundOption = $(soundSelect).find('option')[bar.sound];
                $(soundOption).attr("selected", "selected");
                i++;
            });

        },

        // Funktion zum Setzen des Attributs selected für entsprechende option-Elemente,
        // die ausgewählten Effekte in den einzelnen Takten darstellen
        setSelectedEffect: function (bars) {
            var i = 0;
            var effectSelectElements = $('select.effectSelect');
            bars.forEach(function (bar) {
                var effectSelect = effectSelectElements[i];
                var effectOptions = $(effectSelect).find('option');
                for (var j = 0; j < effectOptions.length; j++) {
                    if (effectOptions[j].getAttribute('value') == bar.effect) {
                        $(effectOptions[j]).attr("selected", "selected");
                    }
                }
                i++;
            });
        },

        // Eventhandler zum Ändern der Effekte
        changeEffect: function (e) {
            var effectSelectId = e.target.id;
            var barIndex = effectSelectId.replace('effect', '');
            var impulseResponseIndex = e.target.options[e.target.selectedIndex].value;
            this.beatBoxController.changeBarEffect(barIndex, impulseResponseIndex);
        }


    });
    return MainView;
});