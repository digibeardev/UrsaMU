// A basic emitter singleton.  I'm going to need it through multiple files.
// Nothing special to see here folks, move along! :3
const { EventEmitter } = require("events");
const emitter = new EventEmitter();
module.exports = emitter;
