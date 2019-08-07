const fs = require("fs");
const path = require("path");
class Help {
  constructor() {
    this.help = new Map();
    this.refresh();
  }

  refresh() {
    const docsDir = path.resolve(__dirname, "../helpdocs/");

    // Grab all of the helpfiles from the helpdocs directory and place
    // them into an in-memory variable.
    fs.readdirSync(docsDir).forEach(file => {
      const filePath = path.resolve(__dirname, `../helpdocs/${file}`);
      this.help.set(
        file
          .split(".")
          .slice(0, -1)
          .join("."),
        {
          text: fs.readFileSync(filePath, "utf-8"),
          category: "general",
          visible: true
        }
      );
    });
  }

  get(help) {
    return this.help.get(help);
  }

  has(help) {
    return this.help.has(help);
  }
}

module.exports = new Help();
