/**
 * Modul bar repräsentiert einen Takt des Beats
 *
 * @module bar.js
 */

define([], function () {
    function Bar() {
        // Array mit 16 x Sechzehntelnoten
        this.notes = new Array(16);
        // Noten mit false füllen
        this.notes.fill(false);
        // Index des Sounds des Takts
        this.sound = 0;
        // Index des Sounds, das als Impulsantwort für ein Effekt dient
        this.effect = 48;
        // Pegel des Effekts
        this.effectLevel = 0;
        // Lautstärke des Takts
        this.volume = 100;
    }

    return Bar;
});
