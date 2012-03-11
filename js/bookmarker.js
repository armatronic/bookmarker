(function($){
    $(function() {
        /**
         * Bookmark model.
         */
        window.Bookmark = Backbone.Model.extend({
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
                }
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
        var file_path = document.location.href.replace(/([\///])[^\///]+$/i, '$1items.json');
//        file_path     = $.twFile.convertUriToLocalPath(file_path);
        window.BookmarkList = Backbone.Collection.extend({
            model: Bookmark,
            fileStorage: new FileStore($.twFile.convertUriToLocalPath(file_path)),
            comparator: function(bookmark) {
                return bookmark.get('order')
            },
            nextOrder: function() {
//                return (this.length == 0) ? 1 : (this.last().get('order')+1);
//                return (this.length == 0) ? 1 : (this.comparator(this.last())+1);
                return this.length + 1;
            }
        });
        window.Bookmarks = new BookmarkList();


        /**
         * Bookmark view - shows a single bookmark.
         */
        window.BookmarkView = Backbone.View.extend({
            tagName: 'li',
            template: $('#bookmark_list .bookmark.template').html(),
            events: {
                'submit .save_form'   : 'saveBookmark',
                'click .cancel'       : 'cancelEdit',
                'click .edit'         : 'editBookmark',
                'click .delete'       : 'deleteBookmark'
            },
            initialize: function() {
                this.model.on('change',  this.render, this);
                this.model.on('destroy', this.remove, this);
                //
                // change_display is triggered when a tag is switched on or off.
                this.model.on('change_display', this.render, this);
                //
                // The view is set into the model, so the render() method can
            },
            render: function() {
                //
                // Set the template's contents based on what's in the model.
                if (this.$el.children().length == 0) {
                    this.$el.html(this.template).removeClass('template').addClass('bookmark');
                }
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
                this.$('.tag_input :input').val(tags.join(' '));
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
            }
        });


        /**
         * A view for a list of bookmarks.
         */
        window.BookmarkerView = Backbone.View.extend({
            el: $('#bookmark_list'),
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
                // Set whether a post is shown based on the shown tags.
                var shown_tags = this.shown_tags;
                this.collection.each(function(bookmark) {
                    if (_.isEmpty(shown_tags) || !_.isEmpty(_.intersection(shown_tags, bookmark.get('tags')))) {
                        bookmark.setAsDisplayed();
                    }
                    else {
                        bookmark.setAsHidden();
                    }
                });
            },
            add: function() {
                this.collection.add({});
                return false;
            },
            addOne: function(bookmark) {
                var view = new BookmarkView({model: bookmark});
                if (bookmark.isNew()) {
                    view.editBookmark();
                }
                this.$('.bookmarks').append(view.render().el);
                return false;
            },
            addAll: function() {
                this.collection.each(this.addOne);
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
                return false;
            },
            addShownTag: function(tag) {
                if (!_.contains(this.shown_tags, tag)) {
                    this.shown_tags.push(tag);
                }
                this.render();
            },
            clearForTag: function(tag) {
                this.shown_tags = _.without(this.shown_tags, tag);
                this.render();
            }
        });
        window.Bookmarker = new BookmarkerView({collection: Bookmarks});
    });
})(jQuery);