var window = window || {};
(function ($) {
    "use strict";
    $(function () {
        //
        // Any browser that uses the jar file for load/save won't load the jar
        // until all ready events have run.
        // The easiest way around this is to put the load in a setTimeout()
        // object, which won't run until the callbacks have finished.
        window.setTimeout(function () {
            $('#bookmark_list').bookmarker({
                file_path: 'items.json'
            });
        });
    });
}(window.jQuery));