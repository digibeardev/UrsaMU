const { find } = require("lodash");
const db = require("./database");

class Attributes {
  set(options) {
    const { id, name, value, setBy, lock = "", key = "" } = options;
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

  get(target, attribute) {
    return find(target.attributes, { name: attribute });
  }
}

module.exports = new Attributes();
