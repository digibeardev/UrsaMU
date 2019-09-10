const { log } = require("../utilities");
const config = require("../../Data/config.json");
const { Database } = require("arangojs");
const moment = require("moment");

const db = new Database(config.database.url);
db.useDatabase(config.database.database);
db.useBasicAuth(config.database.username, config.database.password);
const DBObj = db.collection("objects");

class ObjData {
  /**
   * Create a running index of dbo id #'s
   */
  async initIndex() {
    this.index = ["0"];
    // Search through the db collection and collect all of the
    // current dbrefs.
    try {
      const docs = await DBObj.all();
      const results = await docs.all();
      if (docs.count > 0) {
        for (const doc of results) {
          this.index.push(parseInt(doc._key));
        }
      }
      return this.index.sort();
    } catch (error) {
      log.error(error);
    }
  }

  /** Generate a new ID */
  newKey() {
    // First, check for any gaps in the database. If there's an open
    // number lower than the next increment use that instead.
    const index = this.index.map(entry => parseInt(entry)).sort();

    let mia = index.reduce(function(acc, cur, ind, arr) {
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

  /**
   * Insert a new record into the database
   * @param {DBO} record A new instance of a database tracked object.
   */
  insert(record) {
    // Generate a dbref for the object before we insert it into
    // the database.
    const today = moment().unix();
    record._key = `${this.newKey()}`;
    record.name = record.name.toLowerCase();
    record.description = "You see nothing special.";
    record.alias = "";
    record.attributes = [];
    record.timestamp = 0;
    record.owner = record.owner ? record.owner : record._key;
    record.moniker = "";
    record.created = today;
    record.modified = today;
    record.last = today;
    record.flags = [];
    record.contents = [];
    record.exits = [];
    record.location = config.startingRoom || "";
    record.to = "";
    record.from = "";
    return DBObj.save(record);
  }
  /**
   * Update a database record
   * @param {Number} key The id of the object to execute the updates
   * @param {Object} updates An object with key/value pair updates to
   * be applied to the object.
   */
  update(key, updates) {
    return DBObj.update(key, updates);
  }

  /**
   * Remove an object from the database.
   * @param {Number} key
   */
  remove(key) {
    // Find the index of the file we want to remove
    // from the collection.
    return DBObj.removeByKeys([key]);
  }

  /**
   * Get a database object by id reference.
   * @param {Number} id The id of the object we want to reference.
   */
  key(key) {
    if (key) {
      // #id format. We neeed a number.
      if (key[0] === "#") {
        key = key.slice(1);
        // get our document.
        return DBObj.firstExample({ _key: key });
      } else {
        return DBObj.firstExample({ _key: key });
      }
    } else {
      return { flags: [], exits: [] };
    }
  }

  /**
   * Get a database object either by Key or name.
   * @param {String|Number} ref Ref can be either a name, or an key.  If an key is provided
   * get will try to match a single result.  Else it will search by name and alias,
   * returning an array.
   */
  async get(ref = "") {
    // It's a id reference.
    if (Number.isInteger(parseInt(ref)) || ref[0] === "#") {
      if (ref[0] === "#") {
        ref = ref.slice(1);
      }

      let queryCursor = await db.query(`
        FOR obj IN objects
          FILTER obj._key == "${ref}"
          RETURN obj 
      `);

      // Return the first match
      return await queryCursor.next();

      // It's probably a name reference.  Return with an array
      // of possible matches
    } else {
      try {
        let queryCursor = await db.query(`
        FOR obj IN objects
          FILTER obj.name == "${ref.toLowerCase()}" || obj.alias == "${ref.toLowerCase()}"
          RETURN obj
       `);
        return await queryCursor.all();
      } catch (error) {
        log.error(error);
      }
    }
  }

  /**
   * Find documents based on an AQL query.
   * @param {Object} query The MongoDB query to pull records from the database.
   */
  find(query) {
    return db.query(query);
  }
}

module.exports.db = db;
module.exports.objData = new ObjData();