const fs = require("fs");
const _ = require("lodash");
const db = require("./database");
const { log } = require("./utilities");
const config = require("./config");
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
      log.success("Game flags loaded.");
    } catch {
      log.warning("No Flags database found.  Creating new instance.");
      this.flags = [
        {
          name: "immortal",
          restricted: "immortal"
        },
        {
          name: "wizard",
          restricted: "immortal",
          code: "W"
        },
        {
          name: "royalty",
          restricted: "wizard imortal"
        },
        {
          name: "admin",
          combined: "immortal wizard admin"
        },
        {
          name: "connected",
          restricted: "admin",
          code: "C"
        }
      ];
      try {
        this.save();
      } catch (error) {
        throw error;
      }
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

  /**
   * Checks if a flag exists or not.
   * @param {string} flag A single flag.
   */
  exists(flag) {
    if (flag[0] === "!" || flag[0] === "@") {
      flag = flag.slice(1);
    }
    return _.find(this.flags, { name: flag.toLowerCase() });
  }

  /**
   * Check to see if an object has all of the flags listed.
   * if one fails, the entire stack fails. Optional modfiers
   * are available.
   * '!flag' checks to see if the target does NOT have a flag.
   * '@flag' Optional flag.If it can exist.
   * giving a regular flag means it must exist to pass.
   * @param {DBO} obj The database object representing the
   * the thing being checked for flags
   * @param {string} flags A string of space seperated flags
   * to check against.
   * @return {boolean} A truthy or falsey response is given
   * depending on if the conditions are met or not.
   */
  hasFlags(obj = { flags: [] }, flags = " ") {
    let rtrn = true;

    // We only want to deal with flags that have been defined in the
    // system.
    const cleanFlags = flags.split(" ").filter(flag => this.exists(flag));

    cleanFlags.forEach(flag => {
      // First to see if it's a combined flag.  If so we'll handle it with
      // orFlags().
      const flagObj = this.exists(flag);
      if (flagObj.hasOwnProperty("combined")) {
        if (this.orFlags(obj, flagObj.combined)) {
          rtrn = true;
        }
      } else {
        // !flag.  Check to make sure it's NOT included in the list.
        if (flag[0] === "!") {
          if (obj.flags.indexOf(flag.slice(1)) <= -1) {
            rtrn = true;
          }
          // @flag.  Optional flag.
        } else if (flag[0] === "@") {
          if (obj.flags.indexOf(flag.slice(1)) !== -1) {
            rtrn = true;
          }
          // Else check to see if a flag is listed on the object
        } else {
          if (obj.flags.indexOf(flag) <= -1) {
            rtrn = false;
          }
        }
      }
    });
    return rtrn;
  }

  /**
   * Save the flag database to file.
   */
  save() {
    try {
      fs.writeFileSync(`./data/flags.json`, JSON.stringify(this.flags));
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
    return db.update(obj.id, { flags: [...flagSet] });
  }

  /**
   * Checks to see if enactor has at least one of the given flags.
   * @param {DBO} enactor
   * @param {string} flags
   */
  orFlags(enactor, flags) {
    let ret = false;
    flags
      .toLowerCase()
      .split(" ")
      .forEach(flag => {
        if (this.hasFlags(enactor, flag)) {
          ret = true;
        }
      });
    return ret;
  }

  /**
   * Can enactor edit target?
   * @param {DBO} enactor The DBO of the enactor,
   * @param {DBO} target  The DBO of the target.
   */
  canEdit(enactor, target) {
    if (
      target.id === enactor.id ||
      target.owner === enactor.id ||
      (this.hasFlags(target, "immortal") &&
        this.hasFlags(enactor, "immortal")) ||
      (this.hasFlags(target, "wizard") &&
        this.orFlags(enactor, "immortal wizard")) ||
      (this.hasFlags(target, "royalty") &&
        this.orFlags(enactor, "immortal wizard royalty")) ||
      (this.hasFlags(target, "staff") &&
        this.orFlags(enactor, "imortal wizard royalty staff")) ||
      (this.hasFlags(target, "!immortal !wizard !royalty !staff") &&
        this.orFlags(enactor, "immortal wizard royalty staff"))
    ) {
      return true;
    } else {
      return false;
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
