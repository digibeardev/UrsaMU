const shajs = require("sha.js");
const _ = require("lodash");

module.exports = mush => {
  mush.cmds.set("@account", {
    pattern: /^@?ac[count]+(\/\w+)?\s+(\w+)(?:\s?=\s?(\w+))?/i,
    restriction: "connected",
    run: (socket, data) => {
      const [, option, email, password] = data;
      const enactor = mush.db.od(socket.id);

      // trim and set the email to lowercase
      email = email.trim().toLowerCase();
      password = password.trim();
      option.toLowerCase();

      // see if there's already an account for the email address.
      const acct = mush.accounts.find(email);
      if (!acct && option === "/register" && password) {
      }
    }
  });
};
