module.exports = parser => {
  require("./mushcode-functions-strings")(parser);
  require("./mushcode-functions-math")(parser);
  require("./muschode-functions-misc")(parser);
};
