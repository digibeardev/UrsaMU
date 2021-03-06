const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");
const { log } = require("./utilities");
const { find, findIndex } = require("lodash");

class UserAccts {
  constructor() {
    try {
      this.accounts = JSON.parse(
        readFileSync(resolve(__dirname, "../data/accounts.json"), "utf-8")
      );
      log.success("Player accounts loaded.");
    } catch (error) {
      log.error(`Unable to load Accounts database.  Error: ${error}`);
      this.accounts = {};
      log.success("Created a new instance of the Accounts database.", 2);
      this.save();
    }
  }

  find(email) {
    email = email.toLowerCase();
    return find(this.accounts, { email });
  }

  insert({ email, password }) {
    return this.accounts.push({ email, name, password });
  }

  update(email) {
    email.toLowerCase();
    const index = findIndex(this.accounts, { email });
    this.accounts[index] = { ...this.accounts[index], ...updates };

    return this.accounts[index];
  }

  save() {
    try {
      writeFileSync(
        resolve(__dirname, "../data/accounts.json"),
        JSON.stringify(this.accounts)
      );

      log.success("User Accounts database saved.");
    } catch (error) {
      log.error(`Unable to save Accounts database.  Error: ${error}`);
    }
  }
}

module.exports = new UserAccts();
