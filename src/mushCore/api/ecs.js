const { objData: db } = require("../database");

class ECS {
  constructor() {
    this.systems = new Map();
    this.components = new Map();
    this.filters = new Map();
    this.assem = new Map();
  }

  /**
   * Add a new component to the system.
   * @param {String} name The name of the component
   * @param {Component} data The default data for the
   * component object.
   */
  component(name, data) {
    if (!this.components.has(name.toLowerCase())) {
      if (typeof data === "object") {
        this.components.set(name.toLowerCase(), data);
      } else {
        throw new Error("Components must be objects.");
      }
    } else {
      throw new Error("That component already exists");
    }
  }

  /**
   * Add a component to an entity.
   * @param {DBRef} tar The database object to add the
   * component to.
   * @param {String} comp The name of the component to add
   */
  async add(tar, comp) {
    if (!tar._key) {
      let results = db.get(tar);
      if (Array.isArray(results)) {
        results = results[0];
      }
    }

    if (results._key) {
      let component = this.components.get(comp.toLowerCase());
      results.components[comp.toLowerCase()] = component.defaults;
      const saved = await db.update(results._key, {
        components: results.components
      });

      if (saved._key) {
        return results;
      } else {
        throw new Error("Couldn't save to database");
      }
    } else {
      throw new error("Not a valid entity.");
    }
  }

  remove(tar, comp) {}

  /**
   * Define a new Component system.
   * @param {String} name The name of the sytem.
   * @param {function(DBRef[])} system Callback to run when the system is
   * invoked. It accepts a list of database objects.
   */
  system(name, system) {
    name = name.toLowerCase();
    if (!this.systems.has(name)) {
      this.systems.set(name, system);
    } else {
      throw new Error("That system is already defined.");
    }
  }

  filter(system, filter) {}
}

module.exports = new ECS();

/**
 * A Component
 * @typedef {Object} Component
 * @property {string} name - The name of the component
 * @property {*} defaults - The default data that comes with
 * the component once assigned.
 */

/**
 * @typedef {Object} DBRef
 * @property {Key} _key - The Object identifier
 * @property {String} name - The name of the DBRef
 * @property {String} type - The 'type' of object.  Player,
 * Room, Exit or Thing.
 * @property {Strubg} description - The description displayed
 * when someone 'looks' at the object.
 * @property {String} [alias] - A short name the object can be referenced
 * by. Alias is for players only and will be ignored on other
 * types of bkects
 * @property {Attribute[]} [attributes] - A collection of attributes
 * @property {Key} owner
 * @property {String} [moniker] - Alternate color scheme for a player name
 * @property {Number} created - Unix seconds created
 * @property {Number} modified - Unix seconds modified
 * @property {Number} last - Last time object issued a command.
 * @property {String[]} [flags] - An array of flags representing the object
 * @property {Key[]} [contents] -dbrefs of the objects inside an object.
 * @property {Channel[]} [channels] - Collection of channels the object
 * has joined.
 * @property {Key[]} [exits] - List of exit dbrefs.
 * @property {Lock[]} [locks] - A collection of locks on an object.
 * @property {Key} [location] - dbref where the object resides
 * @property {Key} [to] - WHere an exit leads too.
 * @property {Key} [from] - Where an exit leads  from.
 */

/**
 * @typedef {String} Key - The string representation of the
 * database object number.
 */
