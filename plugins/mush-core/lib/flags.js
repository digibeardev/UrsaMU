const fs = require("fs");
const { mapToJson, jsonToMap } = require("../../../src/utilities");

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
    this.flags =
      fs.readFileSync(
        require("path").resolve(__dirname, "../data/flags.json"),
        {
          encoding: "utf-8"
        }
      ) || new Map();

    // If the flag param is a string, then it should be in JSON
    // form, parse the json and convert it to a Map object.
    if (typeof this.flags === "string") {
      this.flags = jsonToMap(this.flags);
    }
  }

  /**
   * Add a new flag to the sytem
   * @param {string} name
   * @param {FlagOptions} options Any additional options we want
   * set with the flag.
   */
  add(name, options) {
    // Filter through the list of flag options for the
    // ones we're interested in.
    const { restricted, combined, code } = options;

    this.flags.set(name.toLowerCase(), {
      name,
      restricted,
      combined,
      code
    });
  }

  /**
   * Get a flag object
   * @param {string} flag The function can take a single
   * flag or a list of space seperated flags.
   * @return {Flag} Returns a flag object.
   */
  get(flags) {
    const returnFlags = [];
    // First we need to split the flag string into an array
    flags.split(" ").filter(flag => {
      // check to see if there's a NOT before the flag
      if (flag[0] === "!") {
        flag = flag.slice(1);
      }
      // If the flag exists add it to the list.
      if (this.flags.has(flag)) {
        returnFlags.push(that.flags.get(flag));
      }
    });
    // Return the clean list of flags.
    if (returnFlags.length > 1) {
      return returnFlags;
    } else {
      return returnFlags[0];
    }
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
  has(obj = {}, flags = " ") {
    const objFlags = new Set(obj.flags);
    const cleanFlags = flags.split(" ").filter(flag => {
      // this is a big conditional statment.  It checks to see
      // if the flag returns with information (the flag object)
      // And then checks to make sure that the object actually
      // has the flag set.
      if (this.get(flag) && objFlags.has(flag)) {
        return flag;
      }
    });
  }

  /**
   * Clean the given list of flags so that only pre-existing flags remain.
   * @param {string} flags The list of flags we want reduced down to only
   * flags that are registered in the system.
   */
  clean(flags) {
    // Split the string list into seperate tokens to be filtered.
    let cleanFlags = flags.split(" ").filter(flag => {
      let bang = "";
      // chop the ! off of the flag if it exists.
      if (flag[0] === "!") {
        flag = flag.slice(1);
        bang = "!";
      }

      if (this.flags.has(flag.toLowerCase())) {
        return bang + flag;
      }
    });
    return cleanFlags;
  }

  /**
   * Save the flag database to file.
   */
  save() {
    fs.writeFileSync(
      require("path").resolve(__dirname, "../data/flags.json"),
      mapToJson(this.flags)
    );
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
          // Else just push the value. Make sure it's lowercase!
          obj.flags.push(flag.toLowerCase());
        }
      });
      // Return the modified object.
      return obj;
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
