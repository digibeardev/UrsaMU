const parser = require("./parser");
const emitter = require("./emitter");
const broadcast = require("./broadcast");
const { objData } = require("./database");
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

    this.flags.init();
    this.channels.init();

    try {
      require("../commands")(this);
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
      require("./exec")(this);
      this.log.success("Command parser loaded.");
    } catch (error) {
      this.log.error(error);
    }

    require("./gameTimers")(this);

    // Remove the connected flag from player objects incase the database didn't
    // shutdown cleanly.

    // Run plugins if present.
    if (this.plugins) {
      this.plugin(this.plugins);
    }

    // Check for server events!
    this.emitter.on("connected", socket => {
      const enactor = this.db.id(socket.id);
      const curRoom = this.db.id(enactor.location);

      this.broadcast.sendList(
        socket,
        curRoom.contents,
        `${enactor.name} has connected.`,
        "connected"
      );
    });

    this.emitter.on("disconnected", socket => {
      const enactor = this.db.id(socket.id);
      const curRoom = this.db.id(enactor.location);
      this.broadcast.sendList(
        socket,
        curRoom.contents,
        `${enactor.name} has disconnected.`,
        "connected"
      );
    });

    this.emitter.on("channel", (chan, msg) => {
      this.queues.sockets.forEach(socket => {
        const target = this.db.id(socket.id);

        // loop through each channel, and see if there's a match.
        for (const channel of target.channels) {
          if (channel.name == chan.name && channel.status) {
            let header = "";
            header += chan.moniker ? chan.moniker : `%ch<${chan.name}>%cn`;

            try {
              this.broadcast.send(socket, `${header} ${channel.title} ${msg}`);
            } catch {}
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
   * Add a library to be accessable through the game object.
   * @param  {String|Function} args
   */
  use(...args) {
    // If a name and function are given, add it to the game object.
    if (typeof args[0] === "string" && typeof args[1] === "function") {
      this[args[0]] = args[1];
    } else if (typeof args[0] === "function") {
      this[args[0].name] = args[0];
    } else if (typeof args[0] !== "function" || typeof args[0] !== "string") {
      throw new Error("Use requires a function.");
    }
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
  name(en, tar, override = false) {
    // Make sure the enactor has permission to modify the target.
    // if so show dbref and flag codes, etc. Extra admin stuff.
    const objName = this.flags.canEdit(en, tar)
      ? `${tar.name}${this.flags.flagCodes(tar)}`
      : tar.name;

    return en.location === tar.id && !override
      ? `[center(%ch%cr<<%cn %ch%0 %cr>>%cn,78,%cr-%cn)]`
      : objName;
  }
};
