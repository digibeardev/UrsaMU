const { db, objData } = require("./database");
const { VM } = require("vm2");
const { log, sha256 } = require("../utilities");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
const capstring = require("capstring");
const queues = require("./systems/queues");

/**
 * new engine()
 */
module.exports = class UrsaMu {
  constructor(options = {}) {
    const { plugins } = options;
    this.moment = moment;
    this.queues = queues;
    this.capstring = capstring;
    this.cmds = new Map();
    this.txt = new Map();
    this.api = new Map();
    this.systems = new Map();
    this.koguma = new Map();
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

  loadKoguma(folder) {
    // Check for a json file
    try {
      const config = require(path.resolve(
        "./kogumas/" + folder + "/package.json"
      ));
      // Require main file or (defailt index.js)
      if (config) {
        const file = config.main ? config.main : "index.js";
        const parts = folder.split("/");
        // Register koguma.
        this.koguma.set(
          parts.pop(),
          require(path.resolve("./kogumas/" + folder + "/" + file))(this)
        );
        log.success(`Koguma: ${folder} (v${config.version}) loaded.`);
      }
    } catch (error) {
      log.error(error);
    }
  }

  // Check for plugins
  loadKogumas() {
    // Helper function to list directories.
    const getDirectories = source =>
      fs
        .readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const kogumas = getDirectories(path.resolve(__dirname, "../../kogumas/"));
    kogumas.forEach(koguma => this.loadKoguma(koguma));
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
    this.loadSystems(["./commands", "../../text", "./systems/gameTimers"]);
    setTimeout(() => require("./systems/telnet")(this), 3000);
    setTimeout(() => this.loadKogumas(), 3000);

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

    this.emitter.emit("loaded");

    this.emitter.on("connected", async socket => {
      try {
        const enactor = await this.db.key(socket._key);
        const curRoom = await this.db.key(enactor.location);
        this.flags.set(enactor, "connected");
        this.broadcast.sendList(
          socket,
          curRoom.contents,
          `${enactor.name} has connected.`,
          "connected"
        );
      } catch (error) {
        this.log.error(error);
      }
    });

    this.emitter.on("close", async error => {
      if (error) {
        this.queues.sockets.forEach(async (v, k) => {
          if (!v._socket.writable) {
            const target = await this.db.key(k);
            this.flags.set(target, "!connected");
            this.queues.socket.delete(k);
          }
        });
      }
    });

    this.emitter.on("disconnected", async socket => {
      const enactor = await this.db.key(socket._key);
      this.flags.set(enactor, "!connected");
      const curRoom = await this.db.key(enactor.location);
      this.broadcast.sendList(
        socket,
        curRoom.contents,
        `${enactor.name} has disconnected.`,
        "connected"
      );
    });

    this.emitter.on("channel", (socket, chan, msg) => {
      this.queues.sockets.forEach(async socket => {
        const target = await this.db.key(socket._key);

        // loop through each channel, and see if there's a match.
        for (const channel of target.channels) {
          if (channel.name == chan.name && channel.status) {
            let header = "";
            header += chan.header
              ? chan.header
              : `%ch<${capstring(chan.name, "title")}>%cn`;

            try {
              msg = this.parser.run(socket._key, msg);
              this.broadcast.send(socket, `${header} ${channel.title}${msg}`, {
                parse: false
              });
            } catch (error) {
              log.error(error);
            }
          }
        }
      });
    });
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

    socket.timestamp = moment(new Date()).unix();

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

    // Clear API
    this.api.forEach((v, k) => {
      try {
        const { file } = v;
        delete require.cache[require.resolve(`./api/${file}`)];
        this[k] = require(path.resolve(__dirname, "./api/", file));
        log.success(`API Loaded: ${file}`);
      } catch (error) {
        console.log(`API: Failed to load. Error: ${error.stack}`);
      }
    });

    // Clear text
    this.txt = new Map();
    delete require.cache[require.resolve(`../../text`)];
    try {
      require("../../text")(this);
      this.log.success("Text files loaded.");
    } catch (error) {
      this.log.error(`Unable to load text files. Error: ${error}`);
    }

    this.cmds = new Map();

    // Delete references to individual functions and commands
    // Clear functions
    let dir = fs.readdirSync(path.resolve(__dirname, "./functions/lib/"));
    dir.forEach(file => {
      delete require.cache[
        require.resolve(path.resolve(__dirname, "./functions/lib/", file))
      ];
    });

    // Clear Commands
    delete require.cache[require.resolve(`./commands`)];
    dir = fs.readdirSync(path.resolve(__dirname, "./commands/lib/"));
    dir.forEach(file => {
      delete require.cache[
        require.resolve(path.resolve(__dirname, "./commands/lib/", file))
      ];
    });

    // Load commands
    try {
      require("./commands")(this);
      this.log.success("Commands loaded.");
    } catch (error) {
      this.log.error(`Unable to load commands. Error: ${error}`);
    }

    this.koguma.forEach(koguma => koguma.restart());
    this.broadcast.sendAll("%chGAME>>%cn Restart complete.");
  }
};
