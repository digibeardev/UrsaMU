const shajs = require("sha.js");
const _ = require("lodash");

module.exports = mush => {
  mush.cmds.set("@account", {
    pattern: /^@?ac[count]+(\/\w+)?\s+(\w+)(?:\s?=\s?(\w+))?/i,
    restriction: "connected",
    run: (socket, data) => {
      const [, option, email, password] = data;
      const enactor = mush.db.od(socket.id);
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

      if (!acct && option === "/register" && password) {
        mush.accounts.push({ email, password });
        mush.accounts.save();

        mush.broadcast.send(
          `%chDone%cn. Character '%ch${
            enactor.name
          }%cn' has been linked to account '${email}'.`
        );
      } else if (acct && option === "/register" && password) {
        let index = acct.characters.indexOf(enactor.name);
        if (password === acct.password) {
        } else {
          mush.broadcast.send(socket, "Permission denied.");
        }
      }
    }
  });
};
