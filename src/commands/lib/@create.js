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
        `%chDone%cn. Created object %ch${object.name}%cn.`
      );
      mush.db.save();
    }
  });

  mush.cmds.set("drop", {
    pattern: /^drop\s+(.*)/i,
    restriction: "connected",
    run: (socket, match) => {
      const [, name] = match;
      enactor = mush.db.id(socket.id);
      curRoom = mush.db.id(enactor.location);
      target = mush.db.find({ name, location: enactor.id })[0];

      if (target) {
        if (target.location === enactor.id) {
          enactor.contents.splice(enactor.contents.indexOf(target.id), 1);

          mush.db.update(enactor.id, {
            contents: enactor.contents
          });
          mush.db.update(target.id, { location: enactor.location });
          mush.db.update(curRoom.id, {
            contents: [...curRoom.contents, target.id]
          });
          mush.db.save();
          mush.broadcast.sendList(
            curRoom.contents,
            `${enactor.name} drops ${target.name}.`,
            "connected"
          );
        } else {
          mush.broadcast.send(socket, "You're not holding that.");
        }
      } else {
        mush.broadcast.send(socket, "You're not holding that.");
      }
    }
  });

  mush.cmds.set("get", {
    pattern: /^get\s+(.*)/,
    restriction: "connected",
    run: (socket, data) => {
      const [, name] = data;
      const enactor = mush.db.id(socket.id);
      const curRoom = mush.db.id(enactor.location);

      target = mush.db.find({ name, location: enactor.location })[0];

      if (target) {
        mush.db.update(target.id, { location: enactor.id });
        curRoom.contents.splice(curRoom.contents.indexOf(target.id), 1);
        mush.db.update(enactor.id, {
          contents: [...enactor.contents, target.id]
        });
        mush.db.update(curRoom.id, { contents: curRoom.contents });
        mush.db.save();
        mush.broadcast.sendList(
          curRoom.contents,
          `${enactor.name} picks up %ch${target.name}%cn.`,
          "connected"
        );
      } else {
        mush.broadcast.send(socket, "I can't find that here.");
      }
    }
  });

  mush.cmds.set("give", {
    pattern: /^give\s+(.*)\s+to\s+(.*)/,
    restriction: "connected",
    run: (socket, data) => {
      const [, name, reciver] = data;
      const enactor = mush.db.id(socket.id);
      const target = mush.db.name(reciver);
      const items = mush.db.find({ location: enactor.id && name })[0];
      const curRoom = mush.db.id(enactor.location);

      mush.db.update(enactor.id, {
        contents: enactor.contents.splice(enactor.contents.indexOf(items), 1)
      });
      mush.db.update(curRoom.id, {
        contents: curRoom.contents.splice(curRoom.contents.indexOf(items), 1)
      });
      mush.db.update(target.id, { contents: [...target.contents, items.id] });
      mush.db.save();
    }
  });
};
