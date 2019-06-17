const fs = require("fs");
const path = require("path");

module.exports = class HelpSystem {
  constructor(options = {}) {
    const { app } = options;
    this.cmds = app.parser.cmds || new Map();
    this.funs = app.parser.funs || new Map();

    this.init();
  }

  // Initiate the help system.  Check for new commands and
  // and functions then add them to the list.
  init() {
    const today = new Date();
    this.entries = require("../data/helpfile.json");

    Array.from(this.funs.keys()).forEach(key => {
      // Make sure there isn't already an entry for the function in
      // flat file.
      if (!(key in this.entries)) {
        this.entries[key] = {
          type: "function",
          created: today,
          modified: today
        };
      }
    });
    Array.from(this.cmds.keys()).forEach(key => {
      // Make sure there isn't already an entry for the function in
      // flat file.
      if (!(key in this.entries)) {
        this.entries[key] = {
          type: "command",
          created: today,
          modified: today
        };
      }
    });
    return this.entries;
  }

  // Edit a job entry.
  edit(options = {}) {
    const { name, entry, usage } = options;
    if (name in this.entries) {
      this.entries[name].entry = entry;
      this.entries[name].usage = usage ? usage : "";
    }
  }

  save() {
    fs.writeFileSync(
      path.resolve(path.join(__dirname, "../data/helpfile.json")),
      JSON.stringify(this.entries, {}, 2)
    );
  }
};
