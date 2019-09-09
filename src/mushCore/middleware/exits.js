const { matchExit, move } = require("../movement");

module.exports = async (dataWrapper, next) => {
  const { input } = dataWrapper;
  const enactor = await mush.db.key(socket._key);
  const curRoom = await mush.db.key(enactor.location);

  // Check to see if an exit name was enetered.
  const exit = matchExit(curRoom, input);
  if (exit) {
    // Exit match was made.
    dataWrapper.ran = true;
    move(socket, exit);
    mush.exe(socket, "look", []);
    next(null, dataWrapper);
  }

  // didn't run, move along!
  next(null, dataWrapper);
};
