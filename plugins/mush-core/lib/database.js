// Using shortIDs in place of numbers.  I don't have to
// keep reducing for unused dbnums,
const shortid = require("shortid");
const fs = require("fs");
const { EventEmitter } = require("events");
const { mapToJson, jsonToMap } = require("../../../src/utilities");

class Database extends EventEmitter {
  constructor() {
    super();

    // Either read from the json db, or create a new Map.
    this.db =
      fs.readFileSync(require("path").resolve(__dirname, "../data/mush.json"), {
        encoding: "utf-8"
      }) || new Map();

    // If db isn't a Map, convert the json file to one.
    if (!(this.db instanceof Map)) {
      this.db = jsonToMap(this.db);
    }
  }

  // pull a database record by ID
  id(id) {
    return this.db.get(id);
  }

  // Pull a database record based off of the
  // record name.
  name(name) {
    for (const [k, v] of this.db) {
      if (name === v.name) {
        return this.db.get(k);
      }
    }
  }

  // Update the in-memory version of the database.
  update(record) {
    const today = new Date();

    // deconstruct the changes object so we can deal with the
    // individual args of the object.
    const {
      id = shortid.generate(),
      name,
      type = "thing",
      modified = today,
      _attributes = {},
      attributes = {},
      flags = []
    } = record;

    // Check to see if an ID was provided with the update request.
    if (!this.db.has(id)) {
      this.db.set(id, {
        id,
        name,
        type,
        created: today,
        modified,
        _attributes,
        attributes,
        flags
      });

      // if The ID exists, update the current entry.
      // Gotta love spread operators!
    } else {
      record.modified = today;
      this.db.set(id, { ...this.db.get(id), ...{ ...record } });
    }

    return this.db.get(id);
  }

  // Save the in-memory database to file.
  save() {
    fs.writeFileSync(
      require("path").resolve(__dirname, "../data/mush.json"),
      mapToJson(this.db)
    );
  }
}

module.exports = new Database();
