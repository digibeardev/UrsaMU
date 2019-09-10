const { db } = require("./database");
const { log, sha256 } = require("../utilities");
const acctsDB = db.collection("accounts");

class UserAccts {
  async find(query) {
    try {
      const queryCursor = await db.query(`
      FOR acct IN accounts
      FILTER acct.username == "${query.toLowerCase()}" || 
        acct.email == "${query.toLowerCase()}"
        RETURN acct
    `);

      if (queryCursor.hasNext()) {
        return await queryCursor.next();
      }
    } catch (error) {
      log.error(error);
    }
  }

  async insert({ email, username = "", password, key }) {
    try {
      const results = await acctsDB.save({
        email,
        username,
        password: sha256(password),
        characters: [key]
      });

      return results;
    } catch (error) {
      log.error(error);
    }
  }

  async update(query, updates) {
    try {
      const queryCursor = await db.query(`
      FOR acct IN accounts
      FILTER acct.username === "${query.toLowerCase()}" || 
        acct.email == "${query.toLowerCase()}"
        RETURN acct
    `);

      let user;
      if (queryCursor.hasNext()) {
        user = await queryCursor.next();
        acctsDB.update(user, update);
        return user;
      }
    } catch (error) {
      log.error(error);
    }
  }
}

module.exports = new UserAccts();
