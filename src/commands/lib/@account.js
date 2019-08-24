const shajs = require("sha.js");
const _ = require("lodash");

module.exports = mush => {
  mush.cmds.set("@account", {
    pattern: /^@?ac[count]+(\/\w+)?\s+(.*)?/i,
    restriction: "connected",
    run: (socket, data) => {
      let [, option, action] = data;
      let [email, password] = action.split("=");
      const enactor = mush.db.id(socket.id);
      const acct = mush.accounts.find({ email });

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
        mush.hasFlags(socket, "!registered")
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
        let index = acct.characters.indexOf(enactor.name);
        if (password === acct.password) {
          if (index === -1) {
            acct.characters = [...acct.characters, socket.id];
            acct.update(email, { characters: acct.characters });
            acct.save();
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
