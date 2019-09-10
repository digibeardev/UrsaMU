module.exports = async (dataWrapper, next) => {
  // destructure dataWrapper for ease of use.
  const { input, socket, game } = dataWrapper;

  const mush = game;
  // We only need to search for channels if the socket is actually
  // logged in.
  if (socket._key) {
    const enactor = await mush.db.key(socket._key);

    // We need to split the input string, and try and match it to
    // any channel definitions.
    let [alias, ...rest] = input.split(" ");

    let chan;
    if (enactor.channels) {
      for (const channel of enactor.channels) {
        if (channel.alias === alias) {
          return (chan = channel);
        }
      }
    }

    if (
      (chan && chan.status) ||
      (chan &&
        rest
          .join(" ")
          .toLowerCase()
          .trim() === "on")
    ) {
      input = input.replace("\r\n", "\n");

      let msg = "";
      if (rest.join(" ")[0] === ":") {
        msg += `${enactor.moniker ? enactor.moniker : enactor.name} ${rest
          .join(" ")
          .slice(1)}`;
      } else if (rest.join(" ")[0] === ";") {
        msg += `${enactor.moniker ? enactor.moniker : enactor.name}${rest
          .join(" ")
          .slice(1)}`;
      } else {
        rest = rest
          .join(" ")
          .toLowerCase()
          .trim();
        if (rest === "off") {
          mush.emitter.emit(
            "channel",
            mush.channels.get(chan.name),
            `${enactor.name} has left the channel.`
          );
          const index = enactor.channels.indexOf(chan);
          enactor.channels.splice(index, 1);

          // turn the channel off
          chan.status = false;
          enactor.channels.push(chan);
          await mush.db.update(enactor._key, enactor.channels);

          dataWrapper.ran = true;
          next(null, dataWrapper);

          // Turn the channel on
        } else if (rest === "on") {
          const index = enactor.channels.indexOf(chan);
          enactor.channels.splice(index, 1);

          // turn the channel on
          chan.status = true;
          enactor.channels.push(chan);
          mush.emitter.emit(
            "channel",
            await mush.channels.get(chan.name),
            `${enactor.name} has joined the channel.`
          );

          await mush.data.update(enactor._key, enactor.channels);

          dataWrapper.ran = true;
          next(null, dataWrapper);

          // Else it's just a message for the channel
        } else {
          msg += `${
            enactor.moniker ? enactor.moniker : enactor.name
          } says "${rest.join(" ").trim()}"`;
        }
      }

      const channel = await mush.channels.get(chan.name);
      mush.emitter.emit("channel", channel, msg.trim());
      dataWrapper.ran = true;
      next(null, dataWrapper);

      // They have the channel turned off.
    } else if (chan && !chan.status) {
      mush.broadcast.send(socket, "You can't talk on that channel.");
      dataWrapper.ran = true;
      next(null, dataWrapper);
    }
  } else {
    next(null, dataWrapper);
  }
  next(null, dataWrapper);
};
