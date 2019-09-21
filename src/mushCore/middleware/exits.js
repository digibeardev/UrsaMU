const { matchExit, move } = require("../movement");
const { log } = require("../../utilities");
const { objData } = require("../database");
const emitter = require("../emitter");
module.exports = async (dataWrapper, next) => {
  const { input, socket, game } = dataWrapper;
  try {
    const enactor = await objData.key(socket._key);
    const curRoom = await objData.key(enactor.location);

    // Check to see if an exit name was enetered.
    const exit = await matchExit(curRoom, input);
    if (exit) {
      // Exit match was made.
      dataWrapper.ran = true;
      await move(socket, exit);
      game.exe(socket, "look", []);
      game.emitter.emit("move", enactor, exit);
      next(null, dataWrapper);
    }
  } catch (error) {
    log.error(error);
  }

  // didn't run, move along!
  next(null, dataWrapper);
};
