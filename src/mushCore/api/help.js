const { log } = require("../../utilities");
const { readdirSync, readFileSync } = require("fs");
const { resolve } = require("path");
class Help {
  constructor() {
    this.help = new Map();
    this.categories = [];
    this.refresh();
  }

  refresh() {
    let category;
    const walkDir = source => {
      try {
        const dirents = readdirSync(resolve(source), { withFileTypes: true });
        dirents.forEach(dirent => {
          // if it's a file, add it to the help system.
          if (dirent.isFile()) {
            // get the file name, without the extension.
            const name = dirent.name.split(".")[0];

            this.help.set(name, {
              name,
              text: readFileSync(resolve(source, dirent.name), "utf-8"),
              category
            });

            // If it's a file, walk the directory and search for files.  Bam!
            // Recursion.
          } else if (dirent.isDirectory()) {
            category = dirent.name;
            this.categories.push(dirent.name);
            walkDir(resolve(source, dirent.name));
          }
        });
      } catch (error) {
        log.error(error);
      }
    };
    console.log(resolve(__dirname, "../../../helpdocs/"));
    walkDir(resolve(__dirname, "../../../helpdocs/"));
  }
  helpdocs;
  get(help) {
    return this.help.get(help);
  }

  has(help) {
    return this.help.has(help);
  }

  values() {
    return Array.from(this.help.values());
  }

  keys() {
    return this.help.keys();
  }
}

module.exports = new Help();
