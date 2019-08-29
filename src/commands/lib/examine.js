module.exports = mush => {
  mush.cmds.set("examine", {
    pattern: /^e[xamine]+?\s+(.*)?/,
    restriction: "connected",
    run: (socket, data) => {
      let target;
      const enactor = mush.db.id(socket.id);
      if (data[1]) {
        target = mush.db.name(data[1]);
        mush.broadcast.send(socket, doExamine(enactor, target));
      } else {
        mush.broadcast.send(socket, doExamine(enactor, enactor));
      }

      function doExamine(enactor, target) {
        // Add the header information
        output = `${target.moniker ? target.moniker : target.name}\n`;
        output += `Type: ${target.type.toUpperCase()} flags: ${target.flags
          .join(" ")
          .toUpperCase()}\n`;
        output += `Owner: ${target.owner}\n`;

        // add attributes
        for (attr of target.attributes) {
          output += `%ch${attr.name.toUpperCase()}%cn ${attr.value}\n`;
        }

        // add inventory
        for (item of target.contents) {
          output += `${mush.name(enactor, mush.db.id(item))}\n`;
        }
        return output;
      }
    }
  });
};
