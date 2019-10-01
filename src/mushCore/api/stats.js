const { get, set, defaults, has } = require("lodash");
const { objData, db } = require("../database");
const { log } = require("../../utilities");
const shortid = require("shortid");
const capstring = require("capstring");

class Stats {
  constructor() {
    this.models = new Map();
    this.stats = new Map();
    this.init();
  }

  /**
   * Add a new model to the stat system.
   * @param {String} name The name of the model
   * @param {any<Entry>} defaults An object with the default
   * properties for a stat
   *
   * @example
   * // If an entered attribute is missing any of theese
   * // properties, they will be added by default.
   * this.model("attribute", {
   *    name: "Random Attribute",
   *    description: "An Attribute description"
   *    level: "D"
   *    LXP: 0,
   *    TP: 0,
   *    category: "physical"
   * })
   */
  model(name, defaults) {
    return this.models.set(name, defaults);
  }

  async add(array) {
    const added = [];
    const updated = [];
    const failed = [];

    for (const entry of array) {
      // If a model exists, combine the options from the
      // entry with the defaults for the model.  Save the
      // results to the database.
      if (this.models.has(entry.model)) {
        try {
          let dbEntry = defaults(entry, this.models.get(entry.model));
          let entryCursor = await db.query(`
          FOR stat IN stats
            FILTER LOWER(stat.name) == "${
              dbEntry.name ? dbEntry.name.toLowerCase() : ""
            }"
            RETURN stat
          `);
          if (!dbEntry.name) {
            dbEntry.name = `${entry.model} - ${shortid.generate()}`;
          }
          entryCursor = await entryCursor.next();
          // No matches found, save the entry to the database.
          if (!entryCursor) {
            let results = await this.Stats.save(dbEntry);
            results = await this.Stats.firstExample({ _key: results._key });
            this.stats.set(
              entry.name,
              defaults(results, this.models.get(entry.model), entry)
            );
            added.push({ name: entry.name, stat: results });
            // Not a unique name.  Update instead.
          } else {
            // Check for entries that are different and update
            for (const prop in entry) {
              if (entry[prop] !== entryCursor[prop]) {
                entryCursor[prop] = entry[prop];
              }
            }
            let update = await this.Stats.update(entryCursor._key, entryCursor);
            update = await this.Stats.document(entryCursor._key);
            this.stats.set(entry.name, defaults(update, entryCursor));
            updated.push({ name: entry.name, stat: update });
          }
        } catch (error) {
          failed.push({ name: entry.name, error });
        }
      }
    }
    return { added, updated, failed };
  }

  async update(path, value) {
    try {
      const parts = path.split(".");
      const name = capstring(parts[0], "title");
      const sub = parts[1].trim();
      // Get a copy of the stat object
      let error;
      let statQuery = await db.query(`
        FOR stat IN stats
        FILTER stat.name == "${name}"
        RETURN stat`);
      let stat = await statQuery.next();
      let results = await this.Stats.update(stat._key, { [sub]: value });
      results = await this.Stats.firstExample({ _key: results._key });
      // Return new stat ot Error
      this.stats.set(name, results);
      return { error, results };
    } catch (error) {
      log.error(error);
      return { error };
    }
  }

  /**
   * Initiate the stat system.
   */
  async init() {
    // Check to see if stats is in the collections list.
    // If not, create it.
    const collections = await db.listCollections();
    const filteredCols = collections.filter(entry =>
      entry.name === "stats" ? true : false
    );
    this.Stats = db.collection("stats");
    if (filteredCols.length <= 0) {
      try {
        this.Stats.create();
      } catch {}
      try {
        await this.Stats.get();
      } catch (error) {
        log.error(error);
      }
    }
  }

  async info(stat) {
    let query = await db.query(`
      FOR stat IN stats
       FILTER LOWER(stat.name) == "${stat.toLowerCase()}"
       RETURN stat
    `);

    return await query.next();
  }

  exists(mod, path) {
    const model = this.models.get(mod);
    return has(model, path.split(".").pop());
  }

  /**
   * Set a stat on an object.  Launched in an IFFE
   * @param {String} key Key of the player who's stats we're setting
   * @param {String} path "The stat path.  `"attributes.brawn.lxp"` for example."
   * @param {*} value The value we want to set.
   */
  async set(target, path, value) {
    let err;
    try {
      set(target.stats, path, value);
      await objData.update(target._key, { stats: target.stats });
      let stats = await objData.key(target._key);
      return { err, stats };
    } catch (error) {
      return { err: error };
    }
  }

  /**
   * Get a player stat Object
   * @param {String} target the database object that we want to use
   * @param {String} stat The stat object we want.
   */
  async get(target, stat) {
    const statObj = await this.info(stat);
    let results;
    if (stat.match(/\./)) {
      const parts = stat.split("."); // break the dot notation into elements
      const defs = this.models.get(parts[0]);
      results = get(target.stats, stat);
      if (!results) {
        return get(defs, parts.pop());
      } else {
        return results;
      }
    } else {
      const defs = this.models.get(statObj.model);
      results = get(target.stats, `${statObj.model}.${stat.toLowerCase()}`);
      results = defaults(results, defs);
      return results;
    }
  }

  /**
   *  Get a stat's calculated value
   * @param {String} key The key of the target.
   * @param {String} stat The stat we want to get the value of.
   */
  async value(target, objStat) {
    try {
      let results = await this.stats.get(objStat);

      return results.value({
        player: target,
        stat: await this.get(target, objStat)
      });
    } catch (error) {
      log.error(error);
    }
  }
}

module.exports = new Stats();
