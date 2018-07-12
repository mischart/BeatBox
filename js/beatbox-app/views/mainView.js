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
    'app/views/helpers/beatboxcontroller',
    'app/views/helpers/bufferloader',
    'app/views/helpers/utils'
], function ($, _, Backbone, Beats, template, BeatBoxController, BufferLoader, Utils) {
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
                    _this.beatBoxController = new BeatBoxController(beats, _this.options.beatID);
                    _this.render();
                    _this.loadSoundData();
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
            'input .effectIn': 'changeEffectLevel',
            'click #addButton': 'addNewBeat',
            'input #beatSelect': 'selectBeat'


        },

        // Funktion zum Rendern der mainView
        render: function () {
            var compiledTemplate = _.template(template);      //template is the loaded HTML template
            var t = compiledTemplate({beat: this.beatBoxController.currentBeat, beats: this.beatBoxController.beats});
            this.$el.html(t);
            this.setSelectedBarSound(this.beatBoxController.currentBeat.get("bars"));
            this.setSelectedEffect(this.beatBoxController.currentBeat.get("bars"));
            if (this.beatBoxController.currentBeat.id != null) {
                this.setSelectedBeat(this.beatBoxController.currentBeat.id);
            }
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
                    // _this.options.router.navigate('', {trigger: true});
                    // Backbone.history.stop();
                    // Backbone.history.start();
                    _this.options.router.main(null);

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

        // Funktion zum Setzen des Attributs selected für das entsprechende option-Element,
        // das das aktuelle Beat darstellt
        setSelectedBeat: function (beatId) {
            var beatSel = $('#beatSelect option');

            for (var i = 0; i < beatSel.length; i++) {
                if (beatSel[i].value == beatId) {
                    beatSel[i].setAttribute("selected", "selected");
                    break;
                }
            }
        },

        // Eventhandler zum Ändern der Effekte
        changeEffect: function (e) {
            var effectSelectId = e.target.id;
            var barIndex = effectSelectId.replace('effect', '');
            var impulseResponseIndex = e.target.options[e.target.selectedIndex].value;
            this.beatBoxController.changeBarEffect(barIndex, impulseResponseIndex);
        },

        // Eventhandler zum Ändern des Effektpegels
        changeEffectLevel: function (e) {
            var effectInId = e.target.id;
            var barIndex = effectInId.replace('effectIn', '');
            var value = parseInt(e.target.value);
            this.beatBoxController.changeBarEffectLevel(barIndex, value);
        },

        addNewBeat: function () {
            this.stop();
            this.beatBoxController.createNewBeat();
            this.beatBoxController.currentBeat.save();
            this.options.router.main(null);
        },

        // Funktion zur Auswahl und Anzeige eines der gespeicherten Beats im Select-Element
        selectBeat: function (e) {
            this.stop();
            var beatID = e.target.options[e.target.selectedIndex].value;
            this.options.router.main(beatID);
        },

        // Funktion zum Laden der Sound-Daten
        loadSoundData: function () {
            var _this = this;
            var bufferLoader = new BufferLoader(
                Utils.audioContext,
                [
                    //     This application uses these sounds below from freesound:

                    // kick
                    'sounds/kick/40604__pestilenza__kick-11.wav', // author / user http://freesound.org/people/pestilenza/
                    'sounds/kick/42028__psycho-boomer__hard-kick1.wav', // author / user http://freesound.org/people/psycho-boomer/
                    'sounds/kick/171104__dwsd__kick-gettinglaid.wav', // author / user http://freesound.org/people/dwsd/
                    'sounds/kick/183097__dwsd__bd-doitlive.wav', // author / user http://freesound.org/people/dwsd/
                    'sounds/kick/344761__waveplay__punchy-trance-kick-5.wav', // author / user http://freesound.org/people/waveplay/
                    'sounds/kick/346968__giomilko__kick-001.wav', // author / user http://freesound.org/people/giomilko/
                    'sounds/kick/368648__darealwollen__kick-01.wav', // author / user http://freesound.org/people/darealwollen/
                    //snare
                    'sounds/snare/100396__zgump__snare-04.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/snare/165208__rhythmpeople__rpeople-snare2.wav', // author / user http://freesound.org/people/rhythmpeople/
                    'sounds/snare/212208__alexthegr81__tapesnare-15.wav', // author / user http://freesound.org/people/alexthegr81/
                    'sounds/snare/270156__theriavirra__04c-snare-smooth-cymbals-snares.wav', // author / user http://freesound.org/people/theriavirra/
                    'sounds/snare/387186__alexiero-1__ai-snare-20.wav', // author / user http://freesound.org/people/alexiero-1/
                    'sounds/snare/410514__inspectorj__snare-drum-single-hit-a-h1.wav', // author / user http://freesound.org/people/inspectorj/
                    // //hihat
                    'sounds/hihat/55230__dolfeus__zome-7hithatstereo.wav', // author / user http://freesound.org/people/dolfeus/
                    'sounds/hihat/57527__dolfeus__catbeat-hit.wav', // author / user http://freesound.org/people/dolfeus/
                    'sounds/hihat/96140__zgump__zg-hat-01.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/hihat/269720__ianstargem__electronic-closed-high-hat-1.wav', // author / user http://freesound.org/people/ianstargem/
                    'sounds/hihat/404889__gnuoctathorpe__hi-hat3.wav', // author / user http://freesound.org/people/gnuoctathorpe/
                    'sounds/hihat/404890__gnuoctathorpe__hi-hat2.wav', // author / user http://freesound.org/people/gnuoctathorpe/
                    // //bass
                    'sounds/bass/11741__medialint__bassis-big-bass-c2.wav', // author / user http://freesound.org/people/medialint/
                    'sounds/bass/75228__zgump__bass-0101.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/bass/89264__smokum__bass-a2.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/bass/89265__smokum__bass-a3.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/bass/115525__ongitak__bass-stab-11.wav', // author / user http://freesound.org/people/ongitak/
                    'sounds/bass/209943__veiler__bass-16b.wav', // author / user http://freesound.org/people/veiler/
                    'sounds/bass/8521__pitmusic__tb3-bass-02.wav', // author / user http://freesound.org/people/pitmusic/
                    'sounds/bass/89263__smokum__bassdown-d3.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/bass/122422__anillogic__grungebass-a1.wav', // author / user http://freesound.org/people/anillogic/

                    // //others
                    'sounds/others/11741__medialint__bassis-big-bass-c2.wav', // author / user http://freesound.org/people/medialint/
                    'sounds/others/26956__xinaesthete__bsoft2.wav', // author / user http://freesound.org/people/xinaesthete/
                    'sounds/others/28469__simmfoc__blip-1.wav', // author / user http://freesound.org/people/simmfoc/
                    'sounds/others/75228__zgump__bass-0101.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/others/89264__smokum__bass-a2.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/others/89265__smokum__bass-a3.wav', // author / user http://freesound.org/people/smokum/
                    'sounds/others/103015__zgump__el-bass-01.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/others/103016__zgump__el-bass-02.wav', // author / user http://freesound.org/people/zgump/
                    'sounds/others/115525__ongitak__bass-stab-11.wav', // author / user http://freesound.org/people/ongitak/
                    'sounds/others/161841__antistatikk__balloon-bass-03.wav', // author / user http://freesound.org/people/antistatikk/
                    'sounds/others/164699__deleted-user-2195044__sound5a.wav', // author / user https://freesound.org/people/deleted_user_2195044/
                    'sounds/others/209943__veiler__bass-16b.wav', // author / user http://freesound.org/people/veiler/
                    'sounds/others/249300__suntemple__access-denied.wav', // author / user http://freesound.org/people/suntemple/
                    'sounds/others/253178__suntemple__retro-jump-sfx.wav', // author / user http://freesound.org/people/suntemple/
                    'sounds/others/264512__dexus5__geiger1.wav', // author / user http://freesound.org/people/dexus5/
                    'sounds/others/321104__nsstudios__blip2.wav', // author / user http://freesound.org/people/nsstudios/
                    'sounds/others/385927__pol__s002-lap-complete-signal.wav', // author / user http://freesound.org/people/pol/
                    'sounds/others/398088__gamezger__quack.wav', // author / user http://freesound.org/people/gamezger/
                    'sounds/others/405546__raclure__loading-chime.wav', // author / user http://freesound.org/people/raclure/
                    'sounds/others/414888__mattix__8bit-laser-shot-04.wav', // author / user http://freesound.org/people/mattix/
                    //effects (Sounds, die Impulsantworten bilden)
                    'sounds/effects/room.mp3', // quelle: http://audiodesign.raffaseder.net/html/Kap2_6.htm
                    'sounds/effects/cathedral.mp3', // quelle: http://audiodesign.raffaseder.net/html/Kap2_6.htm
                    'sounds/effects/toilet.mp3', // quelle: http://audiodesign.raffaseder.net/html/Kap2_6.htm
                    'sounds/effects/factoryHall.wav', // quelle: https://fokkie.home.xs4all.nl/IR.htm
                    'sounds/effects/smallChurch.wav' // quelle: https://fokkie.home.xs4all.nl/IR.htm

                ], function (bufferList) {
                    //geladene Sounds abspeichern
                    _this.beatBoxController.soundBufferArray = bufferList;
                    _this.beatBoxController.init();
                    _this.enableButtons();

                }
            );

            //Sound-Daten laden
            bufferLoader.load();

        },

        // Funktion zur Aktivierung von Buttons. Sie wird aufgerufen, nachdem Sound-Daten geladen wurden
        enableButtons: function () {
            $(playButton).removeAttr('disabled');
            $(stopButton).removeAttr('disabled');
            $(saveButton).removeAttr('disabled');
            $(deleteButton).removeAttr('disabled');
            $(addButton).removeAttr('disabled');
        }


    });
    return MainView;
});