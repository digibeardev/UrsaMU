module.exports = mush => {
  mush.cmds.set("set", {
    pattern: /^@?set\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      let match;
      let [, target, action] = data;

      const enactor = mush.db.id(socket.id);
      if (target === "me") {
        target = enactor;
      } else if (target === "here") {
        target = mush.db.id(enactor.location);
      } else {
        target = mush.db.find({ name: target });
      }
      // if it returns an array, we only want the first result
      // from the collection.
      if (Array.isArray(target)) {
        target = target[0];
      }

      // Setting an attribute
      if ((match = /^(.*):(.*)/.exec(action))) {
        const [, attribute, value] = match;
        if (mush.flags.canEdit(enactor, target)) {
          mush.db.update(target.id, {
            attributes: [...target.attributes, { name: attribute, value }]
          });
          mush.broadcast.send(
            socket,
            `Done. Attribute %ch${attribute
              .toLowerCase()
              .trim()}%cn set on %ch${
              target.moniker ? target.moniker : target.name
            }%cn.`
          );
          mush.db.save();
        } else {
          mush.broadcast.send("Permission denied.");
        }
      } else {
        // Else they're trying to set a flag.
        mush.flags.set(target, action.toLowerCase());
        mush.broadcast.send(socket, "Flags set.");
        mush.db.save();
      }
    }
  });

  mush.cmds.set("&attribute", {
    pattern: /^&(.*)\s+(.*)\s?=S?(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      let [, attribute, target, setting] = data;
      const enactor = mush.db.id(socket.id);

      if (target.toLowerCase() === "me") {
        target = enactor;
      } else if (target.toLowerCase() === "here") {
        target = mush.db.id(enactor.location);
        // if it starts with a # it's probably a dbref.
      } else if (target[0] === "#") {
        target = mush.db.id(parseInt(target.slice(1)));
        // Else it's probably a name.  Try and match it.
      } else {
        target = mush.db.name(target);
      }

      if (mush.flags.canEdit(enactor, target)) {
        mush.db.update(target.id, {
          attributes: [
            ...target.attributes,
            { name: attribute, value: setting }
          ]
        });
      }
      mush.broadcast.send(
        socket,
        `Done. Attribute '%ch${attribute.toLowerCase()}%cn' set on %ch${
          target.moniker ? target.moniker : target.name
        }%cn.`
      );
      mush.db.save();
    }
  });
};
