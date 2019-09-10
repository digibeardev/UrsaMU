const acctsDB = require("../../mushCore/userAccts");

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
          !(await mush.flags.hasFlags(enactor, "registered"))
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
          if (!(await mush.flags.hasFlags(enactor, " registered"))) {
            if (password === acct.password) {
              if (index === -1) {
                mush.flags.set(enactor, "registered");
                mush.db.save();
                acct.characters = [...acct.characters, socket.id];
                mush.accounts.update(email, { characters: acct.characters });
                mush.accounts.save();
                mush.broadcast.send(
                  socket,
                  `%chDone%cn. Character '%ch${enactor.name}%cn' has been linked to account '%ch${email}%cn'.`
                );
              } else {
                mush.broadcast.send(socket, "permission denied.");
              }
            } else {
              mush.broadcast.send(
                socket,
                "This character is already registered."
              );
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
};
