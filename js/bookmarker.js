/*jslint browser: true, unparam: true, vars: true, white: true, nomen: true, maxerr: 50, indent: 4 */
(function($, _, Backbone){
    "use strict";
    /**
     * Bookmark model.
     */
    var Bookmark = Backbone.Model.extend({
        initialize: function() {
            //
            // Change event: sets the order of this model instance, if this
            // is a new item. (Called here as it requires the collection of
            // this model to be known.)
            this.on('change', function() {
                if (this.isNew()) {
                    this.set(
                        {order: this.collection.nextOrder()},
                        {silent: true}
                    );
                }
            }, this);
        },
        defaults: function() {
            return {
                label: '',
                url:   '',
                tags:  []
            };
        },
        is_displayed: true,
        setAsDisplayed: function() {
            this.is_displayed = true;
            this.trigger('change_display');
        },
        setAsHidden: function() {
            this.is_displayed = false;
            this.trigger('change_display');
        },
        isHidden: function() {
            return !(this.is_displayed);
        }
    });


    /**
     * Bookmark collection - should save bookmarks to a local file.
     */
    var BookmarkList = Backbone.Collection.extend({
        model: Bookmark,
        initialize: function(models, options) {
            try {
                this.file_path   = options.file_path;
                this.fileStorage = new window.FileStore(
                    $.twFile.convertUriToLocalPath(this.file_path)
                );
            }
            catch (ex) {
                $.error('File storage could not be initialised.');
            }
        },
        comparator: function(bookmark) {
            return bookmark.get('order');
        },
        nextOrder: function() {
            return this.length + 1;
        }
    });


    /**
     * Bookmark view - shows a single bookmark.
     */
    var BookmarkView = Backbone.View.extend({
        tagName: 'li',
        events: {
            'submit .save_form'   : 'saveBookmark',
            'click .cancel'       : 'cancelEdit',
            'click .edit'         : 'editBookmark',
            'click .delete'       : 'deleteBookmark',
            'keydown'             : 'handleKeydown'
        },
        initialize: function(options) {
            this.model.on('change',  this.render, this);
            this.model.on('destroy', this.remove, this);
            //
            // change_display is triggered when a tag is switched on or off.
            this.model.on('change_display', this.render,     this);
            this.model.on('cancel_edit',    this.cancelEdit, this);

            //
            // Set the template's contents based on what's in the model.
            if (this.$el.children().length === 0) {
                this.$el.html(options.template).removeClass('template').addClass('bookmark');
            }
        },
        render: function() {
            this.$('.display .bookmark_link')
                .attr('href', this.model.get('url'))
                .text(this.model.get('label'));

            //
            // Set up display of tags.
            var tags         = this.model.get('tags');
            var tag_template = this.$el.find('.button.tag.template');
            var tag_links    = _.map(tags, function(tag) {
                return tag_template.clone().removeClass('template').text(tag).get(0);
            });

            //
            // Clear out any tags that aren't the template, and add them
            // back in.
            this.$('.display .tags').children().not('.template').remove();
            this.$('.display .tags').append(tag_links);
            this.$('.label_input :input').val(this.model.get('label'));
            this.$('.url_input :input').val(this.model.get('url'));

            var tag_input = this.$('.tag_input :input[name="tags"]');
            tag_input.val(tags.join(' '));
            if (_.isUndefined(tag_input.attr('id'))) {
                //
                // The tag selector requires an ID to work. Any ID, doesn't
                // matter what.
                tag_input.attr('id', _.uniqueId('tag_input_'));
            }
            if (this.model.isHidden()) {
                this.$el.hide();
            }
            else {
                this.$el.show();
            }
            return this;
        },
        saveBookmark: function() {
            //
            // Don't save the bookmark yet, but set its values?
            this.model.set({
                label: this.$('.label_input :input').val(),
                url:   this.$('.url_input :input').val(),
                tags:  this.$('.tag_input :input').val().split(/\s+/)
            });
            this.model.save();
            this.$el.removeClass('editing');
            this.render();
            return false;
        },
        editBookmark: function() {
            this.$el.addClass('editing');
            this.$('.label_input :input').focus();
            return false;
        },
        cancelEdit: function() {
            if (this.model.isNew()) {
                this.remove();
            }
            else {
                this.$el.removeClass('editing');
            }
            return false;
        },
        deleteBookmark: function() {
            this.remove();
            this.model.destroy();
            return false;
        },
        handleKeydown: function(event) {
            //
            // if ESC is pressed, then cancel edit.
            if (event.keyCode === 27) {
                this.cancelEdit();
            }
        }
    });


    /**
     * A view for a list of bookmarks.
     */
    var BookmarkerView = Backbone.View.extend({
        events: {
            'click .add'       : 'add',
            'click .tag'       : 'showForTagEvent',
            'click .clear_tag' : 'clearAllShownTags',
            'click .shown_tag' : 'clearForTagEvent'
        },
        shown_tags: [],
        initialize: function() {
            this.collection.on('add',   this.addOne, this);
            this.collection.on('reset', this.addAll, this);
            this.collection.fetch();
            this.default_tag_selector_options = {
                delimiter: ' ',
                autocomplete_url: _.bind(this.tagAutocompleteSource, this)
            };
            this.render();
        },
        render: function() {
            var tag_display   = this.$('.current_tag_display');
            var tag_links     = [];
            var tag_template  = tag_display.find('.shown_tag.template');
            var tag_container = tag_display.find('.current_tag_container');
            if (_.isEmpty(this.shown_tags)) {
                tag_display.addClass('empty');
            }
            else {
                tag_display.removeClass('empty');
                tag_links = _.map(this.shown_tags, function(tag) {
                    return tag_template.clone().removeClass('template').text(tag).get(0);
                });
            }
            tag_container.children().not('.template').remove();
            tag_container.append(tag_links);

            //
            // Set up events for bookmarker tags.
            var self     = this;
            var onChange = _.bind(this.onTagChangeEvent, this);
            var tag_selector_options = {
                delimiter: ' ',
                autocomplete_url: _.bind(this.tagAutocompleteSource, this),
                onChange: onChange,
                onAddTag: function(tag) {
                    self.shown_tags.push(tag);
                    onChange();
                },
                onRemoveTag: function(tag) {
                    self.shown_tags = _.without(self.shown_tags, tag);
                    onChange();
                }
            };
            this.tag_selector = this.$('.tag_selector').tagsInput(tag_selector_options);
        },
        onTagChangeEvent: function() {
            var self = this;
            this.collection.each(function(bookmark) {
                if (_.isEmpty(self.shown_tags) || !_.isEmpty(_.intersection(self.shown_tags, bookmark.get('tags')))) {
                    bookmark.setAsDisplayed();
                }
                else {
                    bookmark.setAsHidden();
                }
            });
        },
        tagAutocompleteSource: function(request, response) {
            //
            // Get every tag from every item in the collection.
            var results = [];
            this.collection.each(function(bookmark) {
                _.each(bookmark.get('tags'), function(tag) {
                    if (tag.indexOf(request.term) === 0 && results.indexOf(tag) === -1) {
                        results.push(tag);
                    }
                });
            });
            response(results.sort());
        },
        add: function() {
            this.collection.add({});
            return false;
        },
        addOne: function(bookmark) {
            var view = new BookmarkView({
                model:    bookmark,
                template: this.$('.bookmark.template').html()
            });
            var bookmark_output = view.render().el;
            this.$('.bookmarks').append(bookmark_output);
            //
            // And set up the tag input on the bookmark.
            $(bookmark_output).find('.tag_input :input').tagsInput({
                delimiter: ' ',
                autocomplete_url: _.bind(this.tagAutocompleteSource, this)
            });
            if (bookmark.isNew()) {
                view.editBookmark();
            }
            return false;
        },
        addAll: function() {
            this.collection.each(this.addOne, this);
        },
        showForTagEvent: function(event) {
            this.addShownTag($(event.target).text());
            return false;
        },
        clearForTagEvent: function(event) {
            this.clearForTag($(event.target).text());
            return false;
        },
        clearAllShownTags: function() {
            this.tag_selector.importTags('');
            return false;
        },
        addShownTag: function(tag) {
            if (!(this.tag_selector.tagExist(tag))) {
                this.tag_selector.addTag(tag);
            }
        },
        clearForTag: function(tag) {
            this.tag_selector.removeTag(tag);
        },
        cancelEdit: function() {
            this.collection.each(function(model) {
                model.trigger('cancel_edit');
            });
        }
    });

    $.bookmarkerElements = {
        Bookmark:       Bookmark,
        BookmarkList:   BookmarkList,
        BookmarkView:   BookmarkView,
        BookmarkerView: BookmarkerView
    };


    /**
     * A jQuery plugin for setting up the bookmarker.
     */
    $.fn.bookmarker = function() {
        //
        // Plugin methods:
        // init
        // getBookmarkerView (which contains the bookmark collection, and can
        // each model in the collection returns the bookmarker view)
        var method  = 'init';
        var options = {};
        var args    = arguments;
        if (args.length === 1) {
            if (_.isObject(args[0])) {
                options = args[0];
            }
            else {
                method = args[0];
            }
        }
        else if (arguments.length > 2) {
            method  = args[0];
            options = args[1];
        }

        //
        // Plugin options:
        // file_path
        if (method === 'init') {
            $.extend(
                {file_path: 'items.json'},
                options
            );

            //
            // Split the doc location into paths, and treat options.file_path as
            // relative.
            // If location is a file and not a directory, then treat file path as
            // relative to the directory the document location is in.
            var this_path_parts = document.location.href.split(/([\\\/]+)/i);
            var last_part       = _.last(this_path_parts);
            if (!last_part.match(/\\\//)) {
                this_path_parts = _.initial(this_path_parts);
            }
            var base_path = this_path_parts.join('');
            var bookmarks = new BookmarkList(
                {},
                {file_path: base_path+String(options.file_path)}
            );
            this.data(
                'bookmarker',
                new BookmarkerView({
                    el:         this,
                    collection: bookmarks
                })
            );
        }
        else if (method === 'getBookmarker') {
            return this.data('bookmarker');
        }
        else if (method === 'destroy') {
            this.data('bookmarker').remove();
        }
        else if (method === 'addBookmark') {
            this.data('bookmarker').add();
        }
        else if (method === 'cancelEdit') {
            this.data('bookmarker').cancelEdit();
        }
        return this;
    };
}(window.jQuery, window._, window.Backbone));