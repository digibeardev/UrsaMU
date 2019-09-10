const { objData } = require("./database");

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
  async set({ key, name, value, setBy }) {
    let target = await objData.key(key);

    // check to see if the attribute already exists!
    // If it does, update, remove the original and re-insert the
    // updated record.
    name = name.toLowerCase();

    // try to find the attribute name in the object
    let found = false;
    if (target.attributes) {
      for (const attr of target.attributes) {
        if (attr.name === name) {
          found = attr;
        }
      }
    }

    // Attribute exists, and value given.
    if (found && value) {
      const index = target.attributes.indexOf(found);
      target.attributes[index]["value"] = value;
      objData.update(target._key, { attributes: target.attributes });
      return await objData.key(key);

      // if the attribut eexists but there's no value, remove
      // the attribute.
    } else if (found && !value) {
      const index = target.attributes.indexOf(found);
      target.attributes.splice(index, 1);
      await objData.update(target._key, { attributes: target.attributes });

      // Else if the attribute doesn't exist, set it's initial
      // value.
    } else {
      target.attributes.push({ name, value, setBy });
      await objData.update(key, { attributes: target.attributes });
      return await objData.key(key);
    }
  }

  /**
   * Get the current value for an attribute
   * @param {number} target The object we want to read an attribute from
   * @param {String} attribute The attribute to be read.
   */
  get(target, attribute) {
    if (target.attributes) {
      for (const attr of target.attributes) {
        if (attr.name.toLowerCase() === attribute.toLowerCase()) {
          return attr.value;
        }
      }
    } else {
      return false;
    }
  }
}

module.exports = new Attributes();
