// Convert Set objects to Json and back for
// data portability.
module.exports.mapToJson = map => {
  return JSON.stringify(Array.from(map), {}, 2);
};
module.exports.jsonToMap = jsonStr => {
  return new Map(JSON.parse(jsonStr));
};
