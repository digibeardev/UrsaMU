module.exports = mush => {
  mush.cmds.set("@set", {
    pattern: /^@?set\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected",
    run: async (socket, data) => {
      let match;
      let [, target, action] = data;

      try {
        const enactor = await mush.db.key(socket._key);
        if (target.trim() === "me") {
          target = enactor;
        } else if (target.trim() === "here") {
          target = await mush.db.key(enactor.location);
        } else {
          target = await mush.db.get(target);
        }
        // if it returns an array, we only want the first result
        // from the collection.
        if (Array.isArray(target)) {
          target = target[0];
        }

        // Setting an attribute
        if ((match = /^(.*):(.*)/.exec(action))) {
          const [, attribute, value] = match;
          if (await mush.flags.canEdit(enactor, target)) {
            mush.attrs.set({
              key: target._key,
              name: attribute,
              value,
              setBy: enactor._key
            });
            mush.broadcast.send(
              socket,
              `Done. Attribute %ch${attribute.trim().toUpperCase()}%cn ${
                value ? "set on" : "removed from"
              } ${
                target.moniker ? target.moniker : "%ch" + target.name + "%cn"
              }.`
            );
          } else {
            mush.broadcast.send("Permission denied.");
          }
        } else {
          const results = [];
          // Else they're trying to set a flag.  Grab the DBO
          // and check to see if they have permission to set the flag.
          for (const flg of action.split(" ").filter(Boolean)) {
            flag = await mush.flags.exists(flg);
            if (flag) {
              // If the enactor passes any restrictions on who can
              // set what flag, add true to the stack else false...
              if (await mush.flags.orFlags(enactor, flag.restricted)) {
                results.push("true");
              } else {
                results.push("false");
              }
              // The flag doesn't exist.  Send a message letting the
              // enactor know.
            } else {
              results.push("false");
              mush.broadcast.send(socket, `Flag '%ch${flg}%cn' doesn't exist.`);
            }
          }

          // If there's no false answer in the index, then the
          // enactor passed all of the flags locks, else if a false
          // is present the whole thing fails.
          if (results.indexOf("false") === -1) {
            const flags = action
              .toLowerCase()
              .split(" ")
              .filter(Boolean);
            for (const flag of flags) {
              let tempFlag;
              await mush.flags.set(target, flag);
              if (flag[0] === "!") {
                tempFlag = flag.slice(1);
              } else {
                tempFlag = flag;
              }
              mush.broadcast.send(
                socket,
                `%chDone%cn Flag '%ch${tempFlag}%cn' ${
                  flag[0] === "!" ? "removed." : "set."
                }`
              );
            }
          } else {
            mush.broadcast.send(socket, "Permission denied.");
          }
        }
      } catch (error) {
        mush.log.error(error);
      }
    }
  });

  mush.cmds.set("&attribute", {
    pattern: /^&(.*)\s+(.*)\s?=S?(.*)/i,
    restriction: "connected",
    run: async (socket, data) => {
      let [, attribute, target, value = ""] = data;
      const enactor = await mush.db.key(socket._key);

      if (target.toLowerCase() === "me") {
        target = enactor;
      } else if (target.toLowerCase() === "here") {
        target = await mush.db.key(enactor.location);
        // if it starts with a # it's probably a dbref.
      } else if (target[0] === "#") {
        target = await mush.db.key(target.slice(1));
        // Else it's probably a name.  Try and match it.
      } else {
        target = awaitmush.db.get(target);
      }

      if (await mush.flags.canEdit(enactor, target)) {
        mush.attrs.set({
          key: target._key,
          name: attribute,
          value,
          setBy: enactor._key
        });
      }
      mush.broadcast.send(
        socket,
        `Done. Attribute '%ch${attribute.trim()}%cn' ${
          value ? "set on" : "removed from"
        } ${target.moniker ? target.moniker : "%ch" + target.name + "%cn"}.`
      );
    }
  });
};
