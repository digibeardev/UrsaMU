const _ = require("lodash");
const db = require("./database");

class Attributes {
  set(options) {
    const { id, name, value, setBy, lock, key } = options;
    const target = db.id(id);

    // check to see if the attribute already exists!
    if (_.find(target.attributes, { name })) {
      return false;
    } else {
      target.attributes.push({ name, value, setBy, lock, key });
      db.update(id, { attributes: target.attributes });
      db.save();
      return db.id(id);
    }
  }

  get(id, attribute) {
    return _.find(target.attributes, { name: attribute });
  }
}

module.exports = new Attributes();
