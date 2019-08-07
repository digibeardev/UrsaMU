const db = require("./database");

class Build {
  constructor(options) {
    const { name, owner, type = "room" } = options;
    if (!name) throw new Error("Name Required");
    this.room = db.insert({ name, owner, type });
    return this.room;
  }

  to(options) {
    const { name, owner, type = "exit", to } = options;
    if (!name) throw new Error("Name required");
    const exit = db.insert({ name, type, owner, to });
    this.room.exits = [...this.room.exits, exit];
  }
}
