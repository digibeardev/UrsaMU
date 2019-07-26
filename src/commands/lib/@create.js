module.exports = mush => {
  mush.cmds.set("@create", {
    pattern: /^@create\s+(.*)/,
    restriction: "connected",
    run: (socket, match) => {
      const object = mush.db.insert({
        name: match[1].trim(),
        type: "thing",
        owner: socket.id,
        location: socket.id
      });
      mush.db.update(socket.id, {
        contents: [...mush.db.id(socket.id).contents, object.id]
      });
      mush.broadcast.send(
        socket,
        `%chDone%cn.  Created %ch${
          object.name
        }%cn. It has been added to your %chinventory%cn.`
      );
      mush.db.save();
    }
  });
};
