module.exports = mush => {
  mush.help.add({
    name: "@dig",
    type: "command",
    entry: `
    @DIG

    COMMAND: @dig[/<switches>] <name> [= <exitlist> [, <exitlist>] ]
  
    Creates a new room with the specified name and displays its number. This
    command costs 10 coins. If the [= <exitlist>] option is used, an exit will
    be opened from the current room to the new room automatically.  If the
    second <exitlist> option (after the comma) is specified, an exit from the
    new room back to the current room with the specified [Exits] name is
    opened.  Either exit creation may fail if you do not have sufficient
    rights to the current room to open or link the new exit.
    Example: The command
  
       @dig Kitchen = Kitchen;k;north;n,south;s
  
    will dig a room called Kitchen, and open an exit called 'Kitchen' in your
    current room.  The ; symbol means that you may enter the exit by typing
    'k', 'north' or 'n' also.  This command also opens the exit 'south;s' from
    'Kitchen' back to where you are.  Only the first Exit name is displayed in
    the Obvious exits list.
  
    If you specify the /teleport switch, then you are @teleported to the
    room after it is created and any exits are opened.
  
    Related Topics: @destroy, @link, @open, LINKING, OBJECT TYPES.
  
  `
  });

  mush.cmds.set("@dig", {
    // I haven't come up with a way to document functions and
    // commands yet - so these will likely change, but for now?
    // Hi!,
    pattern: /^@dig\s+(.*)\s+?=\s+?(.*)/i,
    run: (socket, match, scope) => {
      // capture all of the pieces we're going to need in order to
      // dig a 'room'.
      const name = match[1];
      // The exit names for the to and from exits to the room.
      const [toExit, fromExit] = match[2].split(",");
      // build the room, exits and link them together.
      const curRoom = mush.db[socket.id].location;
      const room = mush.db.update({ name, type: "room" });
      if (room) {
        mush.broadcast.send(socket, `%chDone.%cn Room %ch${room.name}%cn dug.`);
      }

      // To exit
      const toexit = mush.db.update({
        name: toExit,
        type: "exit",
        location: room.id
      });

      if (toexit) {
        mush.broadcast.send(
          socket,
          `%chDone.%cn Exit` +
            `%ch${toexit.name.split(";")[0]}%cn opened to ${
              curRoom.name.split(";")[0]
            }.`
        );
      }

      mush.db.update({
        id: curRoom.id,
        // <3 Spread operators!
        exits: [...toexit, ...mush.db.id(curRoom).exits]
      });

      // From exit
      const fromexit = mush.db.update({
        name: fromExit,
        type: "exit",
        location: room.id
      });

      if (fromexit) {
        mush.broadcast.send(
          socket,
          `%chDone.%cn Exit` +
            `%ch${toexit.name.split(";")[0]}%cn opened to ${
              room.name.split(";")[0]
            }.`
        );
      }

      mush.db.update({
        id: room.id,
        exits: [...fromexit, ...mush.db.id(room).exits]
      });
    }
  });
};
