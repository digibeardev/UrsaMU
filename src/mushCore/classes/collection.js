const { db } = require("../database");
const { defaults } = require("lodash");

module.exports = class Collections {
  constructor(collection) {
    this.collection = db.collection(collection);
    this.collName = collection;
    this.init(collection);
  }

  /**
   * Initialize the collection
   * @param {String} coll The collection to initialize.
   */
  async init(coll) {
    // Check to see if stats is in the collections list.
    // If not, create it.
    const collections = await db.listCollections().catch(error => {
      throw error;
    });
    const filteredCols = collections.filter(entry =>
      entry.name === coll ? true : false
    );
    this.Stats = db.collection(coll);
    if (filteredCols.length <= 0) {
      try {
        this.Stats.create();
      } catch {}
      try {
        await this.collection.get();
      } catch (error) {
        throw error;
      }
    }

    // Trigger some optional methods
    if (this.hasOwnProperty("onLoad")) {
      this.onLoad();
    }
  }

  /**
   * Update a collection.
   * @param {Object} tar - The target object to be updated
   * @param {Object} updates - The fields to be updated on the object.
   */
  async update(tar, updates) {
    await this.collection.update(tar._key, updates).catch(error => {
      throw error;
    });

    return await this.collection
      .firstExample({ _key: tar._key })
      .catch(error => {
        throw error;
      });
  }

  /**
   * Save an object to the collection.
   * @param {Object} tar - The target object to save to the collection.
   */
  async save(tar) {
    await this.collection.save(tar._key).catch(error => {
      throw error;
    });
  }

  /**
   * Given a key, dbref, or name `get()` returns a matching object
   * if one is found.
   * @param {String} ref The object reference to search for.
   */
  async get(ref) {
    // It's a id reference.
    if (Number.isInteger(parseInt(ref)) || ref[0] === "#") {
      if (ref[0] === "#") {
        ref = ref.slice(1);
      }

      return await this.collection.firstExample({ _key: ref }).catch(error => {
        throw error;
      });

      // It's probably a name reference.  Return with the first match.
    } else {
      let queryCursor = await db
        .query(
          `
          FOR entry IN ${this.collName}
          FILTER LOWER(entry.name) == "${ref.toLowerCase()}" 
            || LOWER(entry.alias) == "${ref.toLowerCase()}"
          RETURN entry
       `
        )
        .catch(error => {
          throw error;
        });

      return await queryCursor.next().catch(error => {
        throw error;
      });
    }
  }

  /**
   * Define an optional data model that allows for setting defaults on
   * properties that aren't defined when the object is created.
   * @param {Object} model - An object representing the fields of the
   * collection's documents, as well as default values.
   */
  model(model) {
    this.modelObj = model;
  }

  async insert(tar) {
    // If a model has been defined, use it.
    if (this.modelObj) {
      // Remove properties that aren't defined in the model.
      for (const prop in tar) {
        if (!this.modelObj.hasOwnProperty(prop)) {
          delete tar[prop];
        }
      }
      // Set default values for properties that might be missing.
      let results = await this.save(defaults(tar, this.modelObj)).catch(
        error => {
          throw error;
        }
      );
      return await this.get(results._key).catch(error => {
        throw error;
      });
      // No model defined.
    } else {
      let results = await this.save(tar).catch(error => {
        throw error;
      });
      return await this.get(results._key).catch(error => {
        throw error;
      });
    }
  }

  /**
   * Remove an entry from the collection.
   * @param {DBRef} tar The object to be deleted.
   */
  async remove(tar) {
    await this.collection.remove(tar._key).catch(error => {
      throw error;
    });
  }

  async all() {
    const query = await db
      .query(
        `
      FOR entity IN ${this.collName}
      RETURN entity
    `
      )
      .catch(error => {
        throw error;
      });

    return await query.all();
  }
};
