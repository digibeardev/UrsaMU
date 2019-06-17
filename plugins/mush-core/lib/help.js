const fs = require("fs");
const path = require("path");

class HelpSystem {
  constructor() {
    this.entries = require("../data/helpfile.json");
  }

  add(options) {
    const today = new Date();
    const { name, type, category, entry } = options;

    this.entries[name] = {
      type,
      category,
      entry,
      created: today,
      modified: today
    };
  }

  get(name) {
    return this.entries[name];
  }

  remove(name) {
    delete this.entries[name];
  }

  save() {
    fs.writeFileSync(
      path.resolve(path.join(__dirname, "../data/helpfile.json")),
      JSON.stringify(this.entries, {}, 2)
    );
  }
}

module.exports = new HelpSystem();
