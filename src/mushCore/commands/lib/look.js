moment = require("moment");
const { db } = require("../../database");

module.exports = mush => {
  mush.cmds.set("look", {
    pattern: /^[look]+\s?(.*)?/i,
    restriction: "connected",
    run: async (socket, match) => {
      const evalString = async (en, string, scope) => {
        if (typeof string === "string") {
          return await mush.parser
            .run(en, string, scope, { parse: true })
            .catch(error => {
              throw error;
            });
        } else {
          string = await mush.parser.evaluate(en, string, scope);
        }
      };

      const en = await mush.db.key(socket._key).catch(error => {
        throw error;
      });
      const curRoom = await mush.db.key(en.location).catch(error => {
        throw error;
      });
      let tar = match[1];

      // Check for target
      if (!tar) {
        tar = curRoom;
      } else if (tar === "me") {
        tar = en;
      } else if (tar === "here") {
        tar = curRoom;
      } else {
        tar = await mush.db.get(tar).catch(error => {
          throw error;
        });
        if (Array.isArray(tar)) {
          tar = tar[0];
        }
      }
      let output = "";
      // Name
      const name =
        mush.attrs.has(tar, "nameformat") && en.location === tar._key
          ? mush.attrs.get(tar, "nameformat")
          : `[name(${tar._key})]`;
      let localScope = {};
      localScope["%0"] = await mush.parser.run(
        en._key,
        `[name(${tar._key})]`,
        {},
        { parse: true }
      );
      output = await evalString(en._key, name, {
        ...localScope,
        ...mush.scope
      });

      // Description
      let desc = "%r";
      if (mush.attrs.has(tar, "descformat")) {
        desc += mush.attrs.get(tar, "descformat");
      } else if (mush.attrs.has(tar, "description")) {
        desc += mush.attrs.get(tar, "description");
      } else {
        desc += "You See Nothing Special.";
      }

      localScope = {};
      localScope["%n"] = await mush.parser.run(
        en._key,
        `[name(${en._key})]`,
        {}
      );
      localScope["%#"] = "#" + en._key;

      output += await evalString(en._key, desc, {
        ...localScope,
        ...mush.scope
      });

      // Contents
      output += "%r";
      let contents = [];
      for (let item of tar.contents) {
        item = await mush.db.key(item);
        if (
          (item.type === "player" && mush.flags.hasFlags(item, "connected")) ||
          item.type === "thing"
        ) {
          contents.push(item);
        }
      }
      localScope = {};
      localScope["%0"] = contents.map(item => "#" + item._key).join(" ");
      if (mush.attrs.has(tar, "conformat")) {
        output += await evalString(en._key, mush.attrs.get(tar, "conformat"), {
          ...localScope,
          ...mush.scope
        });
      } else {
        output += tar.type === "player" ? "Carrying:" : "Contents:";
        output += await mush.parser.run(
          en._key,
          contents.map(item => `%r[name(${item._key})]`).join(""),
          mush.scope
        );
      }

      // Exits

      // Get the object infor for each exit.
      const exits = [];
      for (let exit of tar.exits) {
        exit = await mush.db.key(exit);
        exits.push(exit);
      }

      // Check for an exit format listing
      if (mush.attrs.has(tar, "exitformat")) {
        localScope = {};
        localScope["%0"] = exits.map(exit => `#${exit._key}`).join("");
        localScope["me"] = tar._key;
        output +=
          "%r" +
          (await mush.parser.run(
            en._key,
            await mush.attrs.get(tar, "exitformat"),
            { ...mush.scope, ...localScope }
          ));
      } else {
        // default display
        if (exits.length > 0) {
          output += "%rObvious Exits:%r";
          output += exits.map(exit => exit.name.split(";")[0]).join(" ");
        }
      }

      mush.broadcast.send(socket, output);
    }
  });
};
