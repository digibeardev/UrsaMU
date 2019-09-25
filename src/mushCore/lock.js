const { objData } = require("./database");
const { canEdit } = require("./flags");
const { keyToSocket } = require("./queues");
const { send } = require("./broadcast");
const attrs = require("./attributes");
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

  async lock({ enactor, target, lock = "default", key }) {
    const socket = keyToSocket(enactor._key);

    if (this.locks.has(lock)) {
      if (await canEdit(enactor, target)) {
        // Has permission to edit the object.
        target.locks[lock] = key;
        return await objData.update(target._key, { locks: target.locks });
      } else {
        if (socket) {
          send(socket, "Permission denied.");
        }
      }
    } else {
      send(socket, "I don't recognize that lock.");
    }
  }

  async unlock({ enactor, target, lock }) {
    const socket = keyToSocket(enactor._key);
    if (this.locks.has(lock.toLowerCase())) {
      if (await canEdit(enactor, target)) {
        // Has permission to edit
        delete target.locks[lock];
        return await objData.update(target._key, { locks: target.locks });
      } else {
        send(socket, "Permission denied.");
      }
    } else {
      if (socket) {
        send(socket, "I don't understand that lock.");
      }
    }
  }

  async check(en, tar, lock = "default") {
    const socket = keyToSocket(en._key);
    if (canEdit(en, tar)) {
      const key = tar.locks[lock];

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
