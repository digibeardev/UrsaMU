const { find } = require("lodash");
const db = require("./database");
/**
 * new Attributes()
 */
class Attributes {
  /**
   * Set or unset an attribute on an in-game object
   * @param {Object} Options Settings needed for properly setting up
   * an attribute
   * @param {Number} Options.id The ID of the object having an attribute created
   * @param {string} Options.name The name of the attribute to be set.
   * @param {*} Options.value The value of the attribute.  Can be anything honestly.
   * @param {Number} Options.setBy The dbref of the the object responsible for setting
   * the attribute
   * @param {String} [Options.lock = ""] Set a lock string on an attribute
   * @param {String} [Options.key = ""] Set a key on an attribute.
   *
   * @example
   * // More than likely this is going to be set through the context of the engine API.
   * engine.attrs.set({
   *  id: target.id,
   *  name: "foo",
   *  value: "Bar Baz"
   * });
   *
   */
  set({ id, name, value, setBy, lock = "", key = "" }) {
    let target = db.id(id);

    // check to see if the attribute already exists!
    // If it does, update, remove the original and re-insert the
    // updated record.
    name = name.toLowerCase();
    let attr = find(target.attributes, { name });
    if (attr && value) {
      const index = target.attributes.indexOf(attr);
      target.attributes[index]["value"] = value;
      db.update(id, { attributes: target.attributes });
      db.save();
      return db.id(id);

      // Else if the attribute doesn't exist, set it's initial
      // value.
    } else if (attr && !value) {
      const index = target.attributes.indexOf(attr);
      target.attributes.splice(index, 1);
      db.update(id, { attributes: target.attributes });
      db.save();
    } else {
      target.attributes.push({ name, value, setBy, lock, key });
      db.update(id, { attributes: target.attributes });
      db.save();
      return db.id(id);
    }
  }

  /**
   * Get the current value for an attribute
   * @param {number} target The object we want to read an attribute from
   * @param {String} attribute The attribute to be read.
   */
  get(target, attribute) {
    // @ts-ignore
    return find(target.attributes, { name: attribute });
  }
}

module.exports = new Attributes();
