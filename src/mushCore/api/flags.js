const fs = require("fs");
const { objData, db } = require("../database");
const { log } = require("../../utilities");
const flagsList = require("./defaults").flags;

const flagData = db.collection("flags");

/**
 * Class Flags
 * The flags class tracks the different markers set on players
 * and other in-game objects.  Flags help determine permissions,
 * object type, and in some cases, abilities.
 *
 */
class Flags {
  /**
   * This blob of code basically tries to pull the config file,
   * but if it comes up empty create a new Map object.
   */
  init() {
    (async () => {
      try {
        let countCursor = await db.query(`RETURN LENGTH(flags)`);
        let count = await countCursor.next();
        if (count) {
          log.success("Game flags loaded.");

          // Load extra flags defined in the json file
          const dirent = fs.existsSync("../../Data/flags.json");
          if (dirent) {
            const extras = require("../../Data/flags.json");
            this.dbCheck(extras);
          }
        } else {
          throw new Error("No Flags Found!");
        }
      } catch (error) {
        log.error(error);
      }
    })().catch(error => {
      // default flags list:
      log.warning("No Flags database found.  Creating new instance.");
      this.dbCheck(flagsList);

      const dirent = fs.existsSync("../../Data/flags.json");
      if (dirent) {
        const extras = require("../../Data/flags.json");
        this.dbCheck(extras);
      }
    });
  }

  async dbCheck(flags) {
    try {
      // Lop through the list of flag objects
      for (const flag of flags) {
        let flagCursor = await db.query(`
          FOR flag IN flags
            FILTER flag.name == "${flag.name.toLowerCase()}"
            RETURN flag
        `);

        const data = flagCursor.hasNext();
        if (!data) {
          flag.lvl = flag.lvl || 0;
          flag.code = flag.code || "";
          flag.restricted = flag.restricted || "";
          let flg = await flagData.save(flag);
          if (flg) {
            log.success(`Flag added to the database: ${flag.name}`);
          }
        }
      }
    } catch (error) {
      log.info("No user defined flags found.");
    }
  }

  /**
   * cleanFlags()
   * Scrub through a space seperated list of flags removing
   * any entries that are not in the flag database.
   * @param {string} flags The function can take a single
   * flag or a list of space seperated flags.
   * @return {string[]} Returns a list of flags.
   */
  async cleanFlags(flags) {
    let returnFlags, not;
    // First we need to split the flag string into an array
    returnFlags = flags
      .split(" ")
      .filter(flag => {
        // check to see if there's a NOT before the flag
        if (flag[0] === "!") {
          not = "!";
          flag = flag.slice(1);
        }
        // If the flag exists add it to the list.
        if (this.exists(flag)) {
          return not + flag;
        }
      })
      .join(" ");

    return returnFlags;
  }

  /**
   * Checks if a flag exists or not.
   * @param {string} flag A single flag.
   */
  async exists(flag) {
    if (flag[0] === "!") {
      flag = flag.slice(1);
    }
    const flagCursor = await db.query(`
      FOR f IN flags
        FILTER LOWER(f.name) == "${flag.toLowerCase()}"
        RETURN f
    `);

    if (flagCursor.hasNext()) {
      try {
        let data = await flagCursor.next();
        if (data) {
          return data;
        } else {
          return false;
        }
      } catch (error) {
        log.error(error);
      }
    }
  }

  /**
   * Check to see if an object has all of the flags listed.
   * if one fails, the entire stack fails. Optional modfiers
   * are available.
   * '!flag' checks to see if the target does NOT have a flag.
   * @param {DBO} obj The database object representing the
   * the thing being checked for flags
   * @param {string} flags A string of space seperated flags
   * to check against.
   * @return {boolean} A truthy or falsey response is given
   * depending on if the conditions are met or not.
   */
  hasFlags(obj, flags = " ") {
    // We need to iterate through the flag collection
    // without hitting the call stack limit.  Right now
    // has flags is a couple layers deep in recursion.

    // Split the flag param into an array of flags for
    // faster processing.  Check the target object for
    // the presence of the flags.
    flags = flags.split(" ").filter(Boolean);
    const results = [];

    for (let flag of flags) {
      // If there's a not(!) in front of a flag, check
      // to make sure it's NOT on the object.
      if (flag[0] === "!") {
        flag = flag.slice(1);
        // If the flag is in the object's array,
        // fail.
        if (obj.flags.indexOf(flag) === -1) {
          results.push(true);
        } else {
          results.push(false);
        }
        // A normal search, Found it!
      } else if (obj.flags.indexOf(flag) !== -1) {
        results.push(true);
        // ... Or not.
      } else if (/^.+\|.+/g.exec(flag)) {
        results.push(this.orFlags(obj, flag.split("|").join(" ")));
      } else {
        results.push(false);
      }
    }

    // Now we test to see if there were any negative
    // results in the array means missing flags.
    if (results.indexOf(false) === -1) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Set and remove flags from a database tracked object.
   * @param  {DBO} obj The database object we're setting the flags on
   * @param {string} flags A space seperated string of flags.  To remove
   * a flag from an object, use the NOT (!) indicator in front of the flag.
   */
  async set(obj, flags) {
    // First, let's make a Set object to hold our working data.  You can't
    // have repeating values - so it'll filter any repeats for us.
    const flagSet = new Set(obj.flags);

    flags.split(" ").forEach(flag => {
      //Check for flag removals
      if (flag[0] === "!") {
        // Remove the bang '!' from the flag and delete the record from the
        // set if it exits.
        flag = flag.slice(1);
        flagSet.delete(flag);
      } else {
        // Else we're adding an item to the set.
        flagSet.add(flag);
      }
    });

    try {
      obj.flags = [...flagSet];
      const updated = await objData.update(obj._key, {
        flags: obj.flags
      });
      if (updated) {
        return updated;
      } else {
        return false;
      }
    } catch (error) {
      log.error(error);
    }
  }

  /**
   * Checks to see if enactor has at least one of the given flags.
   * @param {DBO} enactor
   * @param {string} flags
   */
  orFlags(enactor, flags = "") {
    let ret = false;
    flags = flags.toLowerCase().split(" ");

    for (const flag of flags) {
      if (this.hasFlags(enactor, flag)) {
        ret = true;
      }
    }

    return ret;
  }

  async get(flag) {
    return db.query(`
      FOR flag IN flags
        FILTER flag.name == "${flag.toLowerCase()}"
        RETURN flag
    `);
  }

  /**
   * Can enactor edit target?
   * @param {DBO} enactor The DBO of the enactor,
   * @param {DBO} target  The DBO of the target.
   */
  async canEdit(enactor, target) {
    try {
      const enactorLvl = await this.flagLvl(enactor);
      const targetLvl = await this.flagLvl(target);
      if (
        enactor._key === target._key ||
        target.owner === enactor._key ||
        enactorLvl >= targetLvl
      ) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      log.error(error);
    }
  }

  async flagLvl(target) {
    try {
      let lvl = 0;
      for (const flag of target.flags) {
        let flagCursor = await this.get(flag);
        let flg = await flagCursor.next();
        // if it's lower than the previous result, replace it
        if (flg.lvl > lvl) {
          lvl = flg.lvl;
        }
      }
      return lvl;
    } catch (error) {
      log.error(error);
    }
  }

  async flagCodes(target) {
    try {
      if (target) {
        let output = `(#${target._key}${target.type[0].toUpperCase()}`;
        for (const flag of target.flags) {
          try {
            const flgCursor = await this.get(flag);

            let flg;
            if (flgCursor.hasNext()) {
              flg = await flgCursor.next();
              output += flg.code;
            } else {
              break;
            }
          } catch (error) {
            log.error(error);
          }
        }
        return output + ")";
      }
    } catch (error) {
      log.error(error);
    }
  }
}

// Make a singleton.  We don't need more than one instance
// of this object executed.
module.exports = new Flags();

// Typedefs

/**
 * The flag entry object type def.
 * @typedef {array} Flag
 * @property {string} name Flag name
 * @property {string} restricted The flags allowed to change
 * the status of this flag on other objects.
 * @property {string} compound A group of flags this one flag represents.
 * For example, to pass the admin flag, you can be God, Wizard, or Staff.
 * @property {string} description A small blurb about what the flag is used
 * for.
 *
 */
