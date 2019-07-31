const config = require("../data/config.json");
const fs = require("fs");
const _ = require("lodash");
const { log } = require("./utilities");

class Database {
  constructor() {
    // Try to load the database from disk, else startup a new
    // database.
    try {
      // Try to load the database file and parse the json.
      const dbFile = fs.readFileSync(
        `./data/${config.name || "Ursamu"}.json`,
        "utf-8"
      );
      this.db = JSON.parse(dbFile) || [];
      // Make an index of the id#s.
      this.initIndex();
      log.success("Database Loaded.");
    } catch {
      // If the file doesn't exist, create ae blank collection.
      this.db = [];
      this.initIndex();
      log.warning("No Database Found.");
      log.success("Starting new database instance.", 2);
    }
  }

  initIndex() {
    this.index = [0];

    // Search through the db collection and collect all of the
    // current dbrefs.
    this.db.forEach(entry => {
      // Push the id of each entry onto the index.
      this.index.push(entry.id);
    });
  }

  newId() {
    // First, check for any gaps in the database. If there's an open
    // number lower than the next increment use that instead.
    let mia = this.index.reduce(function(acc, cur, ind, arr) {
      let diff = cur - arr[ind - 1];
      if (diff > 1) {
        let i = 1;
        while (i < diff) {
          acc.push(arr[ind - 1] + i);
          i++;
        }
      }
      return acc;
    }, []);

    // If we get a return from missing numbers, add the first
    // to the index, and return it.
    if (mia.length > 0) {
      this.index.push(mia[0]);
      return mia[0];

      // Else we just find the next ID number and inc by one.
    } else {
      this.index.push(this.index.length - 1);
      return this.index.length - 1;
    }
  }

  insert(record) {
    // Deconstruct the input object to make sure we're only adding fields
    // recognized by the game code.
    const today = new Date();
    const {
      name,
      description = "You see nothing special.",
      type = "thing",
      created = today,
      modified = today,
      last = today,
      channels = [],
      password,
      alias,
      attributes = {},
      flags = [],
      contents = [],
      exits = [],
      location,
      owner,
      to,
      from,
      descFormat,
      nameFormat,
      conFormat,
      exitFormat
    } = record;

    // Generate a dbref for the object before we insert it into
    // the database.
    const id = this.newId();

    // Insert santitized record into the database as a new entry.
    this.db.push({
      id,
      name,
      description,
      type,
      last,
      created,
      modified,
      channels,
      password,
      alias,
      attributes,
      flags,
      contents,
      location,
      owner,
      exits,
      to,
      from,
      nameFormat,
      descFormat,
      conFormat,
      exitFormat
    });

    return _.find(this.db, { id });
  }

  save() {
    try {
      fs.writeFileSync(
        `./data/${config.name || "Ursa"}.json`,
        JSON.stringify(this.db, {}, 2)
      );
    } catch (err) {
      throw err;
    }
  }

  update(id, updates) {
    const index = _.findIndex(this.db, { id });

    this.db[index] = { ...this.db[index], ...updates };
    return this.db[index];
  }

  remove(id) {
    // Find the index of the file we want to remove
    // from the collection.
    const index = _.findIndex(this.db, { id });
    // Splice it out.
    this.db.splice(index, 1);

    // remove the dbref from the index.
    this.index.splice(id, 1);
  }

  id(id) {
    return _.find(this.db, { id });
  }

  name(name) {
    return _.find(this.db, entry => {
      if (entry.name.toLowerCase() === name.toLowerCase()) {
        return entry;
      } else if (
        entry.hasOwnProperty("alias") &&
        entry.alias.toLowerCase() === name.toLowerCase()
      ) {
        return entry;
      }
    });
  }

  /**
   * Find database items using an object literal.
   * @param {object} query An object litereal with key:value pairs to
   * match in order to find valid entries.
   */
  find(query) {
    return this.db.filter(obj => {
      let match = [];
      for (const key in query) {
        if (obj.hasOwnProperty(key) && obj[key] === query[key]) {
          match.push(true);
        } else {
          match.push(false);
        }
      }

      // See if there's a false in the results array.  If one is present, the
      // whole query fails.
      if (match.indexOf(false) !== -1) {
        return false;
      } else {
        return true;
      }
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
