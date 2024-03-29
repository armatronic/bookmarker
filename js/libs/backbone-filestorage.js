// A simple module to replace `Backbone.sync` with something like TiddlyWiki's
// local file storage, based on local storage
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.

// Generate four random hex digits.
var S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
};

// Generate a pseudo-GUID by concatenating random hexadecimal.
var guid = function() {
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
};

// Our Store is represented by a single JS object in *localStorage*. Create it
// with a meaningful name, like the name you'd give a table.
var FileStore = function(path) {
    this.path = path;
    var store = $.twFile.load(this.path);
    var data  = {};

    //
    // Keep on trying to parse JSON, by stripping garbage chars off the end.
    var keep_going = true;
    var loops      = 0;
    while (keep_going) {
        try {
            data       = JSON.parse(store);
            keep_going = false;
        }
        catch (ex) {
            //
            // JSON couldn't parse, so strip away garbage at end.
            var last_close = store.lastIndexOf('}');
            if (last_close < 0) {
                keep_going = false;
            }
            else {
                store = store.substr(0, last_close+1);
            }
        }
        if (loops++ > 1000) {
            keep_going = false;
        }
    }
    this.data = data;
};

_.extend(FileStore.prototype, {

  // Save the current state of the **Store** to *localStorage*.
  save: function() {
      $.twFile.save(this.path, JSON.stringify(this.data));
  },

  // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
  // have an id of it's own.
  create: function(model) {
    if (!model.id) model.id = model.attributes.id = guid();
    this.data[model.id] = model;
    this.save();
    return model;
  },

  // Update a model by replacing its copy in `this.data`.
  update: function(model) {
    this.data[model.id] = model;
    this.save();
    return model;
  },

  // Retrieve a model from `this.data` by id.
  find: function(model) {
    return this.data[model.id];
  },

  // Return the array of all models currently in storage.
  findAll: function() {
    return _.values(this.data);
  },

  // Delete a model from `this.data`, returning it.
  destroy: function(model) {
    delete this.data[model.id];
    this.save();
    return model;
  }

});

// Override `Backbone.sync` to use delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
Backbone.sync = function(method, model, options) {

  var resp;
  var store = model.fileStorage || model.collection.fileStorage;

  switch (method) {
    case "read":    resp = model.id ? store.find(model) : store.findAll(); break;
    case "create":  resp = store.create(model);                            break;
    case "update":  resp = store.update(model);                            break;
    case "delete":  resp = store.destroy(model);                           break;
  }

  if (resp) {
    options.success(resp);
  } else {
    options.error("Record not found");
  }
};