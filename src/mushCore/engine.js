const { db, objData } = require("./database");
const { VM } = require("vm2");
const { log, sha256 } = require("../utilities");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const capstring = require("capstring");

/**
 * new engine()
 */
module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;
    this.moment = moment;
    this.capstring = capstring;
    this.cmds = new Map();
    this.txt = new Map();
    this.api = new Map();
    this.systems = new Map();
    this.scope = {};
    this.log = log;
    this.db = objData;
    this.plugins = plugins;
    this.VM = VM;
    this.sha256 = sha256;
    this._stack = [];
    this.query = db;

    // Start the boot-up
    this.init();
  }

  loadSystems(paths) {
    paths.forEach(path => {
      try {
        require(path)(this);
        const parts = path.split("/");
        this.systems.set(parts.pop(), path);
        this.log.success(`System: '${path}' loaded.`);
      } catch (error) {
        this.log.error(`Unable to load '${path}' Error: ${error.stack}`);
      }
    });
  }

  loadApi() {
    const dir = fs.readdirSync(path.resolve(__dirname, "./api/"));
    dir.forEach(file => {
      try {
        const mod = require(path.resolve(__dirname, "./api/", file));
        const parts = file.split(".");
        this[parts[0]] = mod;
        this.api.set(parts[0], { mod, file });
        log.success(`API loaded: ${parts[0]}`);
      } catch (error) {
        log.error(error);
      }
    });
  }

  /**
   * Init() holds startup event handlers and listeners for
   * the MUSH
   */
  async init() {
    this.loadApi();
    this.middleware();
    this.loadSystems([
      "./commands",
      "../../text",
      "./systems/gameTimers",
      "./systems/events"
    ]);

    // If there isn't a grid set, UrsaMU will generate a starting
    // room and update the config settings to start all new players
    // there.  This starting room can be changed maually later.
    await this.db.initIndex();
    let room;
    try {
      const rooms = await this.db.find(
        `
      FOR obj IN objects
        FILTER obj.type == "room"
        RETURN obj`
      );
      const data = await rooms.all();
      if (!data.length) {
        this.log.warning("No Grid found. Attempting to dig limbo.");
        try {
          room = await this.db.insert({ name: "Limbo", type: "room" });
          if (room) {
            this.log.success("Limbo succesfully dug.", 2);
            this.config.set("startingRoom", room._key);
          }
        } catch (error) {
          log.error(error);
        }
      }
    } catch (error) {
      log.error(error);
    }

    // make sure noone has has a 'connected' flag, if the game
    // didn't go down smoothly.
    const playerCursor = await db.query(`
      FOR obj IN objects
      FILTER obj.type == "player"
      RETURN obj
    `);

    if (playerCursor.hasNext()) {
      const players = await playerCursor.all();
      for (const player of players) {
        this.flags.set(player, "!connected");
      }
    }

    // Run plugins if present.
    if (this.plugins) {
      this.plugin(this.plugins);
    }

    this.emitter.emit("loaded");
  }

  /**
   * Force a player bit to execute a command
   * @param {Object} socket The socket of the enactor
   * @param {*} command The command to be executed
   * @param {*} args Any special arguments to pass along with the command
   */
  exe(socket, command, args = []) {
    try {
      return this.cmds.get(command).run(socket, args, this.scope);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a middleware to deal with user input streams.
   * @param  {String|Function} args
   */
  middleware() {
    const dir = fs.readdirSync(path.resolve(__dirname, "./middleware/"));
    dir.forEach(file => {
      try {
        const mod = require(path.resolve(__dirname, "./middleware/", file));
        const parts = file.split(".");
        this._stack.push(mod);
        log.success(`Middleware loaded: ${parts[0]}`);
      } catch (error) {
        log.error(error);
      }
    });
  }

  // Check for plugins
  plugin(plugins) {
    // if plugins is an array, process the array.
    if (Array.isArray(plugins)) {
      plugins.forEach(plugin => {
        try {
          require(`../../plugins/${plugin}`)(this);
          this.log.success(`Plugin installed: ${plugin}.`);
        } catch (error) {
          this.log.error(`Could not import plugin: ${plugin}`);
          this.log.error(`${error.stack}`);
        }
      });

      // If it's a string, process the string.
    } else if (typeof plugins === "string") {
      try {
        require("../../plugins/" + plugins)(this);
      } catch (error) {
        this.log.error(`Could not import plugin: ${plugins}`);
        this.log.error(`${error.stack}`);
      }

      // Else it's not a format the plugin system can read.
    } else {
      this.logs.error(`Unable to read plugin: ${plugins}.`);
    }
  }

  /**
   * Show DBref and flag shorthand if looker has proper
   * permissions and/or ownership.
   * @param {DBO} en The enactor
   * @param {DBO} tar The target
   * @param {Boolean} override Don't show fancy header when
   * enactor is inside target.
   */
  async name(en, tar, override = false) {
    // Make sure the enactor has permission to modify the target.
    // if so show dbref and flag codes, etc. Extra admin stuff.
    const objName = this.flags.canEdit(en, tar)
      ? `${tar.name}${await this.flags.flagCodes(tar)}`
      : tar.name;

    return en.location === tar._key && !override
      ? `[center(%ch%cr<<%cn %ch%0 %cr>>%cn,78,%cr-%cn)]`
      : objName;
  }

  handle(socket, data) {
    let idx = 0;
    // combine the socket and input into an object
    // for cleaner transport
    const dataWrapper = {
      input: data,
      socket,
      game: this,
      ran: false
    };

    socket.timestamp = new Date().getTime() / 1000;

    // Iterate through each registered piece of middleware.
    // we'll pass a refrence to the class 'this' so we can
    // use all of
    const next = async (err, dataWrapper) => {
      // if there's an error, bypass the rest of the code and
      // handle it.
      if (err !== null) {
        return setImmediate(() => {
          this.log.error(err);
        });
      }

      if (dataWrapper.ran) {
        return setImmediate(() => Promise.resolve(dataWrapper));
      }

      if (idx >= this._stack.length && !dataWrapper.ran) {
        return setImmediate(() => {
          if (socket._key) this.broadcast.huh(dataWrapper.socket);
        });
      }

      const layer = this._stack[idx++];
      setImmediate(async () => {
        try {
          await layer(dataWrapper, next);
        } catch (error) {
          next(error);
        }
      });
    };
    next(null, dataWrapper);
  }

  restart(en) {
    this.broadcast.sendAll(
      `%chGAME>>%cn Restart by ${
        en.moniker ? en.moniker : en.name
      }. Please Wait...`
    );

    this.config.save();
    delete require.cache[require.resolve(`./commands`)];
    delete require.cache[require.resolve(`../../text`)];
    delete require.cache[require.resolve(`./parser`)];
    delete require.cache[require.resolve(`./flags`)];
    delete require.cache[require.resolve(`./broadcast`)];
    delete require.cache[require.resolve(`./locks`)];
    delete require.cache[require.resolve(`./stats`)];

    // Delete references to individual functions and commands
    let dir = fs.readdirSync(path.resolve(__dirname, "./functions/lib/"));
    dir.forEach(file => {
      delete require.cache[
        require.resolve(path.resolve(__dirname, "./functions/lib/", file))
      ];
    });

    dir = fs.readdirSync(path.resolve(__dirname, "./commands/lib/"));
    dir.forEach(file => {
      delete require.cache[
        require.resolve(path.resolve(__dirname, "./commands/lib/", file))
      ];
    });

    this.cmds = new Map();
    this.txt = new Map();
    this.parser = {};

    try {
      this.parser = require("./api/parser");
      this.log.success("Parser loaded.");
    } catch (error) {
      this.log.error(`Unable to load parser. Error: ${error}`);
    }

    try {
      this.stats = require("./stats");
      this.log.success("Stats loaded.");
    } catch (error) {
      console.log(error);
    }

    try {
      this.flags = require("./api/flags");
      this.log.success("Flags loaded.");
    } catch (error) {
      this.log.error(`Unable to load flags. Error: ${error}`);
    }

    try {
      require("./commands")(this);
      this.log.success("Commands loaded.");
    } catch (error) {
      this.log.error(`Unable to load commands. Error: ${error}`);
    }

    try {
      require("../../text")(this);
      this.log.success("Text files loaded.");
    } catch (error) {
      this.log.error(`Unable to load text files. Error: ${error}`);
    }

    try {
      this.broadcast = require("./api/broadcast");
      this.log.success("broadcast system loaded.");
    } catch (error) {
      this.log.error(`Unable to load broadcast system. Error: ${error}`);
    }

    try {
      this.locks = require("./api/locks");
      this.log.success("Locks loaded.");
    } catch (error) {
      this.log.error(`Unable to load locks. Error: ${error}`);
    }

    this.broadcast.sendAll("%chGAME>>%cn Restart complete.");
  }
};
