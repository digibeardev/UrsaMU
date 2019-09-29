const { objData } = require("../database");
const flags = require("./flags");
const queues = require("../systems/queues");
const attrs = require("./attrs");
const micromatch = require("micromatch");

class Locks {
  constructor() {
    this.locks = new Set([
      "default",
      "getfrom",
      "give",
      "leave",
      "link",
      "mail",
      "open",
      "page",
      "parent",
      "receive",
      "tport",
      "telout",
      "use",
      "drop",
      "user",
      "visible"
    ]);
  }

  add(lock) {
    this.locks.add(lock.toLowerCase());
  }

  has(lock) {
    return this.locks.has(lock.toLowerCase());
  }

  list() {
    return this.locks.values();
  }

  async lock({ en, tar, lock = "default", key }) {
    let err;

    if (this.locks.has(lock)) {
      if (await flags.canEdit(en, tar)) {
        // Has permission to edit the object.
        tar.locks.push({ lock, key });
        await objData.update(tar._key, { locks: tar.locks });
        tar = await objData.key(tar._key);
      } else {
        err = "Permission denied.";
      }
    } else {
      err = "I don't recognize that lock.";
    }

    return { err, tar };
  }

  async unlock({ en, tar, lock }) {
    let err, found;
    if (this.locks.has(lock.toLowerCase())) {
      if (await flags.canEdit(en, tar)) {
        // Has permission to edit
        for (const loc of tar.locks) {
          if (loc.lock === lock) {
            found = loc;
          }
        }

        tar.locks.splice(tar.locks.indexOf(found), 1);
        await objData.update(tar._key, { locks: tar.locks });
        tar = await objData.key(tar._key);
      } else {
        err = "Permission denied.";
      }
    } else {
      err = "I don't understand that lock.";
    }
    return { err, tar };
  }

  async check(en, tar, lock = "default") {
    let key;
    if (flags.canEdit(en, tar)) {
      for (const loc of tar.locks) {
        if (loc.lock === lock) {
          key = loc.key;
        }
      }

      // Get the key
      let keyValue, match, type;
      if ((match = key.match(/^([\+=\$@])*/))) {
        keyValue = key.slice(1);
        type = match[1];
      } else {
        keyValue = key;
        type = "";
      }

      // Attribute lock
      if ((match = keyValue.match(/(.*):(.*)/))) {
        return await this._evalAttr({ en, type, key: keyValue });
        // Object lock
      } else {
        return await this._evalObject({ en, type, key: keyValue });
      }
    }
  }

  async _evalObject({ en, key, type }) {
    let tar;

    if (key.toLowerCase() === "me") {
      tar = en;
    } else if (key.toLowerCase() === "here") {
      tar = await objData.key(en.location);
    } else {
      tar = await objData.get(key);
      if (tar.length > 0) tar = tar[0];
    }

    if (tar) {
      // Enactor IS target
      if (type === "=") en._key === tar._key ? true : false;

      // Enactor OWNS target
      if (type === "$") en._key === tar.owner ? true : false;

      // Enactor CARRIES target
      if (type === "+") {
        for (const item of en.contents) {
          const obj = await objData.key(item);
          if (this._match(key, obj.name)) {
            return true;
          }
        }

        // Enactor CARRIES or IS target
      } else {
        if (en._key === tar._key) true;

        for (const item of en.contents) {
          const obj = await objData.key(item);
          if (this._match(key, obj.name)) {
            return true;
          }
        }
      }
    } else {
      return false;
    }

    // If nothing else matches, return false.
    return false;
  }

  _match(val1, val2) {
    return micromatch.isMatch(val1, val2);
  }

  async _evalAttr({ en, key, type }) {
    // Evaluate the key: Attribute.  Check to see if we need
    // to evaluate the enactor, the objects in their
    // inventory, or both

    // Check enactor's inventory
    if (type === "+") {
      for (const item of en.contents) {
        const attr = await attrs.get(item, match[1]);
        if (attr) this._match(key, attr.value);
      }
      // Check enactor
    } else if (type === "=") {
      const attr = await attrs.get(en, match[1]);
      if (attr) this._match(key, attr.value);
    } else {
      // Check inventory
      let attr;
      for (const item of en.contents) {
        attr = await attrs.get(item, match[1]);
        if (attr) this._match(key, attr.value);
      }

      // Check Enactor
      attr = await attrs.get(en, match[1]);
      if (attr) this._match(key, attr.value);

      // Else return false. Not on enactor of any of
      // their possessions.
      return false;
    }
  }
}

module.exports = new Locks();
