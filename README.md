# Bookmarker

## Summary

This is a basic bookmark page. It writes its bookmarks to a single JSON file in
the same directory as its index file, so therefore it is well suited to being
stored in a Dropbox directory - from there, of course, you can access your
bookmarks from any computer which you've set up with your Dropbox account.

## Compatibility

Any compatibility issues revolve around the twFile plugin used for file saving.

Internet Explorer (all versions, tested with 9) and Firefox (all versions)
should be okay, as file system access libraries are built into these browsers.

Chrome/Chromium uses a Java applet to work, and may have issues depending on
the version of the Java plugin that is used. The Sun/Oracle Java plugin is known
to work, the OpenJDK plugin (usually available from Ubuntu) is known to have
problems. At any rate, either browser may need to be started with the
"--enable-file-cookies" and "--allow-file-access-from-files" command line
arguments.

Opera and Safari were not tested, but both of these use the Java applet as well,
so they probably have similar issues to Chrome.

## License

Standard MIT license.

## Credits

This project uses [Backbone.js](http://documentcloud.github.com/backbone/) and
[jQuery](http://jquery.com) JavaScript libraries. Local file saving
is provided by jQuery twFile plugin, available at
[http://jquery.tiddlywiki.org/twFile.html](http://jquery.tiddlywiki.org/twFile.html)
and based on local file saving that is a part of
[TiddlyWiki](http://tiddlywiki.com/).

Icons pinched from famfamfam Silk icon set, available at
[http://www.famfamfam.com/lab/icons/silk/](http://www.famfamfam.com/lab/icons/silk/)