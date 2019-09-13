const parser = require("./parser");
const emitter = require("./emitter");
const broadcast = require("./broadcast");
const { db, objData } = require("./database");
const flags = require("./flags");
const config = require("./config");
const queue = require("./queues");
const { VM } = require("vm2");
const help = require("./helpsys");
const grid = require("./grid");
const attrs = require("./attributes");
const useraccts = require("./userAccts");
const channels = require("./channels");
const { log, sha256 } = require("../utilities");
const move = require("./movement");
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
    this.attrs = attrs;
    this.moment = moment;
    this.move = move;
    this.accounts = useraccts;
    this.help = help;
    this.capstr = capstring;
    this.grid = grid;
    this.parser = parser;
    this.broadcast = broadcast;
    this.emitter = emitter;
    this.cmds = new Map();
    this.txt = new Map();
    this.scope = {};
    this.log = log;
    this.db = objData;
    this.flags = flags;
    this.queues = queue;
    this.config = config;
    this.plugins = plugins;
    this.VM = VM;
    this.sha256 = sha256;
    this.channels = channels;
    this._stack = [];
    this.query = db;

    // Install base middleware.
    this.use(require("./middleware/comsys"));
    this.use(require("./middleware/cmds"));
    this.use(require("./middleware/exits"));

    // Start the boot-up
    this.init();
  }

  /**
   * Init() holds startup event handlers and listeners for
   * the MUSH
   */
  async init() {
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

    this.flags.init();
    await this.channels.init();

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

    require("./gameTimers")(this);

    // Remove the connected flag from player objects incase the database didn't
    // shutdown cleanly.

    // Run plugins if present.
    if (this.plugins) {
      this.plugin(this.plugins);
    }

    this.emitter.emit("loaded");

    // Check for server events!
    this.emitter.on("move", ({ socket, exit, room }) => {
      this.exe(socket, "look", []);
    });

    this.emitter.on("connected", async socket => {
      try {
        const enactor = await this.db.key(socket._key);
        const curRoom = await this.db.key(enactor.location);

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

    this.emitter.on("disconnected", async socket => {
      const enactor = await this.db.key(socket._key);
      const curRoom = await this.db.key(enactor.location);
      this.broadcast.sendList(
        socket,
        curRoom.contents,
        `${enactor.name} has disconnected.`,
        "connected"
      );
    });

    this.emitter.on("channel", (chan, msg) => {
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
              msg = this.parser.run(msg);
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
   * Add a middleware to deal with user input streams.
   * @param  {String|Function} args
   */
  use(middleware) {
    this._stack.push(middleware);
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
      this.parser = require("./parser");
      this.log.success("Parser loaded.");
    } catch (error) {
      this.log.error(`Unable to load parser. Error: ${error}`);
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

    this.broadcast.sendAll("%chGAME>>%cn Restart complete.");
  }
};
