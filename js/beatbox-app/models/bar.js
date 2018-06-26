define([], function () {
    function Bar() {
        this.notes = new Array(16);
        this.notes.fill(false);
        this.sound = undefined;
        this.volume = 100;
    }

    return Bar;
});
