(function($){
    $(function() {
        /**
         * Bookmark model.
         */
        window.Bookmark = Backbone.Model.extend({
            defaults: function() {
                return {
                    label: '',
                    url:   '',
                    tags:  [],
                    order: Bookmarks.nextOrder()
                }
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
            template: $('#bookmark_list .template').html(),
            events: {
                'submit .save_form' : 'saveBookmark',
                'click .cancel'     : 'cancelEdit',
                'click .edit'       : 'editBookmark',
                'click .delete'     : 'deleteBookmark'
            },
            initialize: function() {
                this.model.on('change',  this.render, this);
                this.model.on('destroy', this.remove, this);
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

                var tags         = this.model.get('tags');
                var tag_template = this.$el.find('.button.tag.template');
                var tag_links    = _.map(tags, function(tag) {
                    return tag_template.clone().removeClass('template').text(tag).get(0);
                });
                this.$('.display .tags').empty().append(tag_links);
                this.$('.label_input :input').val(this.model.get('label'));
                this.$('.url_input :input').val(this.model.get('url'));
                this.$('.tag_input :input').val(tags.join(' '));
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
                'click .save_all'  : 'saveAll',
                'click .tag'       : 'showForTag',
                'click .clear_tag' : 'render'
            },
            collection: Bookmarks,
            initialize: function() {
                this.collection.on('add',   this.addOne, this);
                this.collection.on('reset', this.addAll, this);
                this.collection.fetch();
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
                Bookmarks.each(this.addOne);
            },
            saveAll: function() {
                //
                // Use tiddly thing to save changes.
//                this.collection.each(function(bookmark) {
//                    bookmark.save();
//                })
                return false;
            },
            showForTag: function() {
                return false;
            }
        });
        window.Bookmarker = new BookmarkerView();
    });
})(jQuery);