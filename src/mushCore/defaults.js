module.exports.flags = [
  {
    name: "immortal",
    restricted: "immortal",
    code: "i",
    lvl: 10
  },
  {
    name: "wizard",
    restricted: "immortal",
    code: "W",
    lvl: 9
  },
  {
    name: "royalty",
    restricted: "wizard imortal",
    lvl: 8
  },
  {
    name: "staff",
    restricted: "immortal wizard royalty",
    code: "w",
    lvl: 7
  },
  {
    name: "coder",
    restricted: "immortal wizard",
    code: "@"
  },
  {
    name: "connected",
    restricted: "admin",
    code: "C"
  },
  {
    name: "registered",
    restricted: "immortal wizard",
    code: "r"
  },
  {
    name: "ic",
    restricted: "immortal wizard royalty staff"
  },
  {
    name: "approved",
    restricted: "immortal wizard royalty staff",
    code: "a"
  },
  {
    name: "safe",
    code: "s"
  }
];

module.exports.channels = [
  {
    name: "Public",
    see: "",
    join: "",
    talk: "",
    mod: "immortal|wizard|royalty",
    owner: "",
    header: ""
  },
  {
    name: "Newbie",
    see: "",
    join: "",
    talk: "",
    mod: "immortal|wizard|royalty",
    owner: "",
    header: ""
  },
  {
    name: "Staff",
    see: "immortal|wizard|royalty",
    join: "immortal|wizard|royalty",
    talk: "immortal|wizard|royalty",
    mod: "immortal|wizard",
    owner: "",
    header: ""
  }
];
