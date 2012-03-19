/*jslint browser: true, unparam: true, vars: true, white: true, nomen: true, maxerr: 50, indent: 4 */
(function ($) {
    "use strict";
    $(function () {
        //
        // Any browser that uses the jar file for load/save won't load the jar
        // until all ready events have run.
        // The easiest way around this is to put the load in a setTimeout()
        // object, which won't run until the callbacks have finished.
        window.setTimeout(function () {
            var bookmark_list = $('#bookmark_list');
            bookmark_list.bookmarker({
                file_path: 'items.json'
            });
            //
            // Keyboard shortcuts.
            window.key('n', function() {
                bookmark_list.bookmarker('addBookmark');
                return false;
            });
            window.key('esc', function() {
                bookmark_list.bookmarker('cancelEdit');
                return false;
            });
        });
    });
}(window.jQuery));