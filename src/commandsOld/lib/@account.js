const shajs = require("sha.js");
const { find } = require("lodash");

module.exports = mush => {
  mush.cmds.set("@account", {
    pattern: /^@?ac[count]+(\/\w+)?\s+(.*)?/i,
    restriction: "connected",
    run: (socket, data) => {
      let [, option, action] = data;
      let [email, password] = action.split("=");
      const enactor = mush.db.id(socket.id);
      const acct = find(mush.accounts.accounts, { email });
      // trim and set the email to lowercase
      email = email.trim().toLowerCase();
      option.toLowerCase();

      // encrypt the password
      if (password) {
        password = shajs("sha256")
          .update(password.trim())
          .digest("hex");
      }

      if (
        !acct &&
        option === "/register" &&
        password &&
        !mush.flags.hasFlags(enactor, "registered")
      ) {
        mush.accounts.insert({ email, password, id: socket.id });
        mush.accounts.save();
        mush.flags.set(enactor, "registered");
        mush.db.save();
        mush.broadcast.send(
          socket,
          `%chDone%cn. Character '%ch${
            enactor.name
          }%cn' has been linked to account '%ch${email}%cn'.`
        );
      } else if (
        (acct && option === "/register" && password) ||
        (acct &&
          option === "/register" &&
          password &&
          mush.flags.hasFlags(enactor, "registered"))
      ) {
        let index = acct.characters.indexOf(enactor.id);
        if (password === acct.password) {
          if (index === -1) {
            mush.flags.set(enactor, "registered");
            mush.db.save();
            acct.characters = [...acct.characters, socket.id];
            mush.accounts.update(email, { characters: acct.characters });
            mush.accounts.save();
            mush.broadcast.send(
              socket,
              `%chDone%cn. Character '%ch${
                enactor.name
              }%cn' has been linked to account '%ch${email}%cn'.`
            );
          } else {
            mush.broadcast.send(
              socket,
              "This character is already registered to that email."
            );
          }
        } else {
          mush.broadcast.send(socket, "Permission denied.");
        }
      }
    }
  });
};
