const Datastore = require("nedb");
const shajs = require("sha.js");
const config = require("./data/config.json");

class Database {
  constructor() {
    // Start up the datastore
    this.db = new Datastore({
      filename: `../data/${config.name}.db`,
      autoload: true
    });
  }

  insert(record) {
    // Deconstruct the input object to make sure we're only adding fields
    // recognized by the game code.
    const today = new Date();
    let dbref;

    const {
      _id = this.id(),
      name,
      description = "You see nothing special.",
      type = "thing",
      created = today,
      modified = today,
      channels = [],
      password = "",
      alias = "",
      attributes = {},
      flags = [],
      contents = [],
      location = "",
      owner = ""
    } = record;

    // Insert santitized record into the database as a new entry.
    return this.db.insert(
      {
        _id,
        name,
        description,
        type,
        created,
        modified,
        channels,
        password,
        alias,
        attributes,
        flags,
        contents,
        location,
        owner
      },
      (err, newDoc) => {
        if (err) throw err;
        return newDoc;
      }
    );
  }

  update(id, updates) {
    this.db.update({ _id: id }, updates, {}, (err, replaced) => {
      if (err) throw err;
    });
    return this.id(id);
  }

  remove(id) {
    this.db.remove({ _id: id }, err => {
      if (err) throw err;
    });
  }

  id(id) {
    return this.db.findOne({ _id: id }, (err, doc) => {
      if (err) throw err;
      return doc;
    });
  }
}

/**
 * Database Object
 * @typedef {Object} DBO
 * @property {string} ID - The ID string of the object
 * @property {string} name - The name of the object
 * @property {string} description - The description of the object.
 * @property {string[]} channels - a list of the subscribed channels.
 * @property {string} type - The type of DBO being made, player, room, exit or thing.
 * @property {Date} created - The date the object was created
 * @property {Date} modified - The date the object was last modified
 * @property {string} password - An encrypted password.
 * @property {string} alias - optional alias (second name).
 * @property {object} attributes - Where public in-game attributes are kept.
 * @property {string[]} flags - The list of flags the object currently has set.
 * @property {string[]} contents - The IDs of objects held by thie one.
 * @property {string[]} exits - Any exits on the object.
 * @property {string} Location - The ID of the object's current location.
 * @property {string} owner - The creater of the object.  dbref ID.
 */

module.exports = new Database();
