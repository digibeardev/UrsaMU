const DataStore = require("nedb");
const shortid = require("shortid");
const db = new DataStore({
  filename: "../data/mush-core.json",
  autoload: true
});

class Database {
  constructor() {
    this.db = db;
  }

  findByName(name) {
    this.db.findOne({ name }, (doc, err) => {
      if (err) throw error;
    });
    return doc;
  }

  findByID(id) {
    db.findOne({ _id: id }, (doc, err) => {
      if (err) throw err;
      return doc;
    });
  }

  add(doc) {
    const today = new Date();
    doc._id = shortid.generate();
    doc.created = doc.created || today;
    doc.modified = doc.modified || today;

    db.insert(doc, (newDoc, err) => {
      if (err) throw err;
      return newDoc;
    });
  }
}

module.exports = new Database();
