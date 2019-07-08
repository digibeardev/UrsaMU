const shortid = require("shortid");
const fs = require("fs");
const { EventEmitter } = require("events");
const { mapToJson, jsonToMap } = require("../../../src/utilities");

/**
 * New Database()
 */
class Database extends EventEmitter {
  constructor() {
    super();

    // Either read from the json db, or create a new Map for the
    // in-memory database.
    this.db =
      fs.readFileSync(require("path").resolve(__dirname, "../data/mush.json"), {
        encoding: "utf-8"
      }) || new Map();

    // If db isn't a Map, convert the json file to one.
    if (!(this.db instanceof Map)) {
      this.db = jsonToMap(this.db);
    }
  }

  /**
   * Retrieve a database object
   * @param {string} id The ID of the object we want to pull
   * from the database
   * @return {DBO} The database object {@link DBO} for the ID given.
   */
  id(id) {
    return this.db.get(id);
  }

  /**
   * Retrieve a database object by name.  If given one name it
   * returns a single object reference.  When given a string list of names,
   * or would return a list, it returns an array of database objects.
   * @param {string} name The name of the object(s) to pull from the database.
   *
   */
  // Look up how to return multiple types in JSDoc notation.  Merg.
  name(names) {
    // An array to hold all of the dbobjects that pass the filtering tests.
    let passed = [];
    // Split the list of names out into an array and filter for
    // names that actually coencide with a database reference.
    if (names) {
      names = names.split(" ").filter(name => {
        // For each one of the entries, loop through the database
        // and look for all of the references of 'name'.

        // Cycle through the DB and search for references.
        for (const dbref of Array.from(this.db.keys())) {
          // capture the dbobject from the dbref.
          const obj = this.db.get(dbref);

          // check to see if the object even has a name property.
          if (obj.hasOwnProperty("name")) {
            // Try to make a match.
            if (name.toLowerCase() == obj.name.toLowerCase()) {
              return passed.push(this.db.get(dbref));
              // If we can't find a match by name, let's check and
              // see if we can match the given name to an alias.
            } else if (
              obj.hasOwnProperty("alias") &&
              name.toLowerCase() === obj.alias.toLowerCase()
            ) {
              return passed.push(this.db.get(dbref));
            }
          }
        }
      });
      // if there's more than one entry in passed, give the whole
      // array.  Else just the first entry.
      return passed.length > 1 ? passed : passed[0];
    }
  }

  /**
   * Add or update a database entry. To make changes to an entry
   * You just have to save it with new or different values for the
   * different fields.  It will only update the properties that
   * have changed since last save.
   * @param {DBO} record - The database record you want to update
   * @return {DBO}
   */
  update(record) {
    const today = new Date();

    // deconstruct the changes object so we can deal with the
    // individual args of the object.
    const {
      id = shortid.generate(),
      name,
      type = "thing",
      modified,
      created,
      attributes = {},
      flags = [],
      contents = [],
      location,
      password,
      description,
      channels,
      exits,
      owner
    } = record;

    // Check to see if an ID was provided with the update request.
    if (!this.db.has(id)) {
      this.db.set(id, {
        id,
        name,
        type,
        created: created ? created : today,
        modified: modified ? modified : today,
        attributes,
        password,
        flags,
        contents,
        location,
        description,
        channels,
        exits,
        owner
      });

      // if The ID exists, update the current entry.
      // Gotta love spread operators!
    } else {
      record.modified = today;
      this.db.set(id, { ...this.db.get(id), ...{ ...record } });
    }

    return this.db.get(id);
  }

  /**
   * Save the in-memory database to a JSON file.
   */
  save() {
    fs.writeFileSync(
      require("path").resolve(__dirname, "../data/mush.json"),
      mapToJson(this.db)
    );
  }
}

/**
 * Database Object
 * @typedef {Object} DBO
 * @property {string} ID - The ID string of the object
 * @property {string} name - The name of the object
 * @property {Date} created - The date the object was created
 * @property {Date} modified - The date the object was last modified
 * @property {object} attributes - Where public in-game attributes are kept.
 * @property {string[]} flags - The list of flags the object currently has set.
 * @property {string[]} contents - The IDs of objects held by thie one.
 * @property {string} Location - The ID of the object's current location.
 */

module.exports = new Database();
