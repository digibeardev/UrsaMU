const fs = require("fs");

class Help {
  constructor() {
    try {
      // Open the helpfile JSON file if it exists and parse it
      // into an object literal.
      const helpFile = JSON.parse(
        fs.readFileSync("../data/help.json", "utf-8")
      );
      for (const entry in helpFile) {
        this.flags.set(entry.name, entry);
      }
    } catch {
      this.help = new Map();
    }
  }

  add(entry) {
    const { category, name, body, usage = "" } = entry;
    this.help.set(name, { name, category, body, usage });
  }
}

module.exports = new Help();
