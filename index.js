const db = require("./src/database");

console.log(
  db.db.find({ _id: 6 }, (err, doc) => {
    return doc;
  })
);
