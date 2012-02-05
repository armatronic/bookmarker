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
        window.BookmarkList = Backbone.Collection.extend({
            model: Bookmark,
            comparator: function(bookmark) {
                return bookmark.get('order')
            },
            nextOrder: function() {
                return (this.length == 0) ? 1 : this.comparator(this.last())+1;
            }
        });
        window.Bookmarks = new BookmarkList();


        /**
         * A view for a list of bookmarks.
         */
        window.BookmarkerView = Backbone.View.extend({
            el: $('#bookmark_list'),
            events: {
                'click .add'       : 'addOne',
                'click .save_all'  : 'saveAll',
                'click .tag'       : 'showForTag',
                'click .clear_tag' : 'render'
            },
            collection: Bookmarks,
            initialize: function() {
                this.collection.on('add',   this.addOne, this);
                this.collection.on('reset', this.addAll, this);
            },
            addOne: function() {
                var view = new BookmarkView({model: new Bookmark()});
                view.editBookmark();
                this.$('.bookmarks').append(view.render().el);
                return false;
            },
            addAll: function() {
                Bookmarks.each(this.addOne);
            },
            saveAll: function() {
                //
                // Use tiddly thing to save changes.
                return false;
            },
            showForTag: function() {
                return false;
            }
        });
        window.Bookmarker = new BookmarkerView();


        /**
         * Bookmark view - shows a single bookmark.
         */
        window.BookmarkView = Backbone.View.extend({
            tagName: 'li',
            template: Bookmarker.$('.template').html(),
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
                var this_view = this.$el.html(this.template).removeClass('template').addClass('bookmark');
                this_view.find('.display .bookmark_link')
                    .attr('href', this.model.get('url'))
                    .text(this.model.get('label'));

                var tags = this.model.get('tags');
                var tag_links = _.map(tags, function(tag) {
                    return $('<a href="#" class="tag" />').text(tag).wrap('<p />').parent().html();
                }).join(', ');
                this_view.find('.display .tags').append(tag_links);
                this_view.find('.label_input :input').val(this.model.get('label'));
                this_view.find('.url_input :input').val(this.model.get('url'));
                this_view.find('.tag_input :input').val(tags.join(' '));
                return this;
            },
            saveBookmark: function() {
                //
                // Don't save the bookmark yet, but set its values.
                this.model.set({
                    label: this.$('.label_input :input').val(),
                    url:   this.$('.url_input :input').val(),
                    tags:  this.$('.tag_input :input').val().split(/\s+/)
                });
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
                this.$el.removeClass('editing');
                return false;
            },
            deleteBookmark: function() {
                this.remove();
                this.model.destroy();
                return false;
            }
        });
    });
})(jQuery);