module.exports = mush => {
  mush.cmds.set("@set", {
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
          mush.attrs.set({
            id: target.id,
            name: attribute,
            value,
            setBy: enactor.id
          });
          mush.broadcast.send(
            socket,
            `Done. Attribute %ch${attribute.trim().toUpperCase()}%cn ${
              value ? "set on" : "removed from"
            } ${target.moniker ? target.moniker : "%ch" + target.name + "%cn"}.`
          );
          mush.db.save();
        } else {
          mush.broadcast.send("Permission denied.");
        }
      } else {
        const results = [];
        // Else they're trying to set a flag.  Grab the DBO
        // and check to see if they have permission to set the flag.
        for (const flg of action.split(" ").filter(Boolean)) {
          flag = mush.flags.exists(flg);

          // If the enactor passes any restrictions on who can
          // set what flag, add true to the stack else false...
          if (mush.flags.orFlags(enactor, flag.restricted)) {
            results.push("true");
          } else {
            results.push("false");
          }
        }

        // If there's no false answer in the index, then the
        // enactor passed all of the flags locks, else if a false
        // is present the whole thing fails.
        if (results.indexOf("false") === -1) {
          mush.flags.set(target, action.toLowerCase());
          mush.broadcast.send(socket, "Flag(s) set.");
          mush.db.save();
        } else {
          mush.broadcast.send(socket, "Permission denied.");
        }
      }
    }
  });

  mush.cmds.set("&attribute", {
    pattern: /^&(.*)\s+(.*)\s?=S?(.*)/i,
    restriction: "connected",
    run: (socket, data) => {
      let [, attribute, target, value = ""] = data;
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
        mush.attrs.set({
          id: target.id,
          name: attribute,
          value
        });
      }
      mush.broadcast.send(
        socket,
        `Done. Attribute '%ch${attribute.trim()}%cn' ${
          value ? "set on" : "removed from"
        } ${target.moniker ? target.moniker : "%ch" + target.name + "%cn"}.`
      );
      mush.db.save();
    }
  });
};
