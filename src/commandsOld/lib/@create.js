const { find } = require("lodash");

module.exports = mush => {
  mush.cmds.set("@create", {
    pattern: /^@create\s+(.*)/,
    restriction: "connected immortal|wizard|royalty|staff",
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
      let target;

      // The three possible combinations for target.  A dbref,
      // a number, or a name.
      if (name[0] === "#") {
        target = mush.db.id(parseInt(name.slice(1)));
      } else if (Number.isInteger(parseInt(name))) {
        target = mush.db.id(parseInt(name));
      } else {
        for (const item of enactor.contents) {
          if (name.toLowerCase() === mush.db.id(item).name.toLowerCase()) {
            target = mush.db.id(item);
          }
        }
      }

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
          mush.broadcast.send(socket, `You drop %ch${target.name}%cn.`);
          mush.broadcast.sendList(
            socket,
            curRoom.contents,
            `${enactor.name} drops %ch${target.name}%cn.`,
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
      let target;
      // The three possible combinations for target.  A dbref,
      // a number, or a name.
      if (name[0] === "#") {
        target = mush.db.id(parseInt(name.slice(1)));
      } else if (Number.isInteger(parseInt(name))) {
        target = mush.db.id(parseInt(name));
      } else {
        for (const item of curRoom.contents) {
          if (name.toLowerCase() === mush.db.id(item).name.toLowerCase()) {
            target = mush.db.id(item);
          }
        }
      }

      if (target) {
        mush.db.update(target.id, { location: enactor.id });
        curRoom.contents.splice(curRoom.contents.indexOf(target.id), 1);
        mush.db.update(enactor.id, {
          contents: [...enactor.contents, target.id]
        });
        mush.db.update(curRoom.id, { contents: curRoom.contents });
        mush.db.save();
        mush.broadcast.send(socket, `You pick up %ch${target.name}%cn.`);
        mush.broadcast.sendList(
          socket,
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
      const curRoom = mush.db.id(enactor.location);
      const target = mush.db.name(reciver);
      let thing;
      if (name[0] === "#") {
        thing = mush.db.id(parseInt(name.slice(1)));
      } else if (Number.isInteger(parseInt(name))) {
        thing = mush.db.id(parseInt(name));
      } else {
        for (const item of enactor.contents) {
          if (name.toLowerCase() === mush.db.id(item).name.toLowerCase()) {
            thing = mush.db.id(item);
          }
        }
      }

      enactor.contents.splice(enactor.contents.indexOf(thing.id), 1);
      mush.db.update(enactor.id, { contents: enactor.contents });
      mush.db.update(target.id, { contents: [...target.contents, thing.id] });
      mush.db.save();
      mush.broadcast.send(
        socket,
        `You give %ch${thing.name}%cn to ${target.name}`
      );
      mush.broadcast.sendList(
        socket,
        curRoom.contents,
        `${enactor.name} gives %ch${thing.name}%cn to ${target.name}`
      );
    }
  });
};
