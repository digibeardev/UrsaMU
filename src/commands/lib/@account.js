const acctsDB = require("../../mushCore/userAccts");
const { db } = require("../../mushCore/database");

module.exports = mush => {
  mush.cmds.set("@account", {
    pattern: /^@?ac[count]+(\/\w+)?\s+(.*)?/i,
    restriction: "connected",
    run: async (socket, data) => {
      let [, option, action] = data;
      let [email, password] = action.split("=");
      let enactor, acct;

      try {
        enactor = await mush.db.key(socket._key);
        acct = await acctsDB.find(email);
      } catch (error) {
        mush.log.error(error);
      }
      // trim and set the email to lowercase
      email = email.trim().toLowerCase();
      option.toLowerCase();
      try {
        if (
          !acct &&
          option === "/register" &&
          password &&
          (await mush.flags.hasFlags(enactor, "!registered"))
        ) {
          await acctsDB.insert({ email, password, key: socket._key });
          await mush.flags.set(enactor, "registered");
          mush.broadcast.send(
            socket,
            `%chDone%cn. Character '%ch${
              enactor.moniker ? enactor.moniker : enactor.name
            }%cn' has been linked to account '%ch${email}%cn'.`
          );
        } else if (acct && option === "/register" && password) {
          if (await mush.flags.hasFlags(enactor, "!registered")) {
            if (mush.sha256(password) === acct.password) {
              let index = acct.characters.indexOf(enactor._key);
              if (index === -1) {
                await mush.flags.set(enactor, "registered");
                acct.characters = [...acct.characters, socket._key];
                mush.accounts.update(email, { characters: acct.characters });
                mush.broadcast.send(
                  socket,
                  `%chDone%cn. Character '%ch${enactor.name}%cn' has been linked to account '%ch${email}%cn'.`
                );
              } else {
                mush.broadcast.send(socket, "permission denied.");
              }
            } else {
              mush.broadcast.send(socket, "Permission denied.");
            }
          } else {
            mush.broadcast.send(
              socket,
              "This character is already registered."
            );
          }
        }
      } catch (error) {
        mush.log.error(error);
      }
    }
  });

  /**
   * register is a shorter command than
   */
  mush.cmds.set("@register", {
    pattern: /^@?re[gister]+\s+(.*)\s?=\s?(.*)/i,
    restriction: "connected",
    run: async (socket, data) => {
      let [, email, password] = data;
      email.toLowerCase();
      mush.exe(socket, "@account", [, "/register", email + "=" + password]);
    }
  });

  /**
   * Unregister a character from the account system.
   */
  mush.cmds.set("@unregister", {
    pattern: /^@?unre[gister]+\s+(.*)/,
    restriction: "connected",
    run: async (socket, data) => {
      try {
        let [email, password] = data[1].split("=").map(entry => entry.trim());
        acct = await acctsDB.find(email);
        const enactor = await mush.db.key(socket._key);
        if (acct && (await mush.flags.hasFlags(enactor, "registered"))) {
          if (mush.sha256(password) === acct.password) {
            let index = acct.characters.indexOf(socket._key);
            acct.characters.splice(index, 1);
            await mush.flags.set(enactor, "!registered");
            await acctsDB.update(acct.email, { characters: acct.characters });
            mush.broadcast.send(
              socket,
              "Your character has been unregistered."
            );
          } else {
            mush.broadcast.send(socket, "Permission denied.");
          }
        } else {
          mush.broadcast.send(socket, "This character isn't registered.");
        }
      } catch (error) {
        mush.log.error(error);
      }
    }
  });
};
