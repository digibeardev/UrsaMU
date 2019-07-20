const fs = require("fs");
const _ = require("lodash");

/**
 * Class Flags
 * The flags class tracks the different markers set on players
 * and other in-game objects.  Flags help determine permissions,
 * object type, and in some cases, abilities.
 *
 */
class Flags {
  constructor() {
    /**
     * This blob of code basically tries to pull the config file,
     * but if it comes up empty create a new Map object.
     */

    try {
      this.flags = JSON.parse(
        fs.readFileSync("./data/flags.json", {
          encoding: "utf-8"
        })
      );
      console.log("\u2714 SUCCESS: Game flags loaded.");
    } catch (error) {
      console.log("\u2716 ERROR: No flag.json file found.");
      this.flags = [];
    }
  }

  /**
   * Add a new flag to the sytem
   * @param {string} name
   * @param {FlagOptions} options Any additional options we want
   * set with the flag.
   */
  add(options) {
    // Filter through the list of flag options for the
    // ones we're interested in.
    const { name, restricted, combined, code } = options;

    // Push the new flag onto the shack.
    this.flags.push({
      name,
      restricted,
      combined,
      code
    });
  }

  /**
   * cleanFlags()
   * Scrub through a space seperated list of flags removing
   * any entries that are not in the flag database.
   * @param {string} flags The function can take a single
   * flag or a list of space seperated flags.
   * @return {string[]} Returns a list of flags.
   */
  cleanFlags(flags) {
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

  exists(flag) {
    return _.find(this.flags, { name: flag.toLowerCase() });
  }

  /**
   * Check to see if an object has all of the flags listed.
   * if one fails, the entire stack fails.
   * @param {DBO} obj The database object representing the
   * the thing being checked for flags
   * @param {string} flags A string of space seperated flags
   * to check against.
   * @return {boolean} A truthy or falsey response is given
   * depending on if the conditions are met or not.
   */
  hasFlags(obj = { flags: [] }, flags = " ") {
    let funcReturn = true;
    const cleanFlags = this.cleanFlags(flags);
    cleanFlags.split(" ").forEach(flag => {
      if (obj.flags.indexOf(flag) === -1) {
        funcReturn = false;
      }
    });
    return funcReturn;
  }

  /**
   * Save the flag database to file.
   */
  save() {
    try {
      fs.writeFileSync(
        `./data/${config.name || "ursa"}.db`,
        JSON.stringify(this.flags)
      );
    } catch (err) {
      throw err;
    }
  }

  /**
   * Set and remove flags from a database tracked object.
   * @param  {DBO} obj The database object we're setting the flags on
   * @param {string} flags A space seperated string of flags.  To remove
   * a flag from an object, use the NOT (!) indicator in front of the flag.
   */
  set(obj, flags) {
    // First make sure we're dealing with an object.
    if (typeof obj === "object") {
      // Break the string of flags into an array, then loop through each...
      flags.split(" ").forEach(flag => {
        // Check to see if we're adding or removing a flag
        if (flag[0] === "!") {
          flag = flag.slice(1);
          // This basically means find where flag lives (indexOf) and remove it
          // from the object.
          const index = obj.flags.indexOf(flag);
          if (index !== -1) {
            obj.flags.splice(index, 1);
          }
        } else {
          obj.flags = obj.flags ? obj.flags : (obj.flags = []);
          obj.flags.push(flag.toLowerCase());
        }
      });
      // update the database record
      return { flags: obj.flags };
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

/**
 * Database Object
 * @typedef {Object} DBO
 * @property {string} ID - The ID string of the object
 * @property {string} name - The name of the object
 * @property {Date} created - The date the object was created
 * @property {Date} modified - The date the object was last modified
 * @property {Object} _attributes - Private attributes unseeable to
 * most player types.
 * @property {object} attributes - Where public in-game attributes are kept.
 * @property {array} flags - The list of flags the object currently has set.
 */
