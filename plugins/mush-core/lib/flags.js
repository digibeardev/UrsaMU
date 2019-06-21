const db = require("./database");
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
      require("fs").readFileSync(
        require("path").resolve(__dirname, "../data/flags.json"),
        {
          encoding: "utf-8"
        }
      ) || new Map();

    // If the flag param is a string, then it should be in JSON
    // form, parse the json and convert it to a Map object.
    if (typeof this.flags === "string") {
      console.log(this.flags.length);
      this.flags = jsonToMap(this.flags);
    }
  }

  /**
   * Get a flag object
   * @param {string} flag Th flag you want to grab the
   * information object from.
   * @return {Flag} Returns a flag object.
   */
  get(flag) {
    // Just making the flag name lowercase now, so I
    // don't have to keep doing it. :P
    flag = this.flag.toLowerCase();

    if (this.flags.has(flag)) {
      return this.flags.get(flag);
    } else {
      return null;
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
  has(obj, flags) {
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

    if (cleanFlags.length >= 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Set and remove flags from a database tracked object.
   * @param {DBO} obj The database object we're setting the flags on
   * @param {string} flags A space seperated string of flags.  To remove
   * a flag from an object, use the NOT (!) indicator in front of the flag.
   */
  set(obj, flags) {}
}

// Make a singleton.  We don't need more than one instance
// of this object executed.
module.exports = new Flags();

// Typedefs

/**
 * The flag entry object type def.
 * @typedef {object} Flag
 * @property {string} name Flag name
 * @property {string} restricted The flags allowed to change
 * the status of this flag on other objects.
 * @property {string} compound A group of flags this one flag represents.
 * For example, to pass the admin flag, you can be God, Wizard, or Staff.
 * @property {string} description A small blurb about what the flag is used
 * for.
 *
 */
