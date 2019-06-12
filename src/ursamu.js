const {EventEmitter} = require('events')

class UrsaMu extends EventEmitter {
    constructor() {
        super()
    }

    // include a plugin to the server.
    use(plugin) {
        require(plugin)(this)
    }

}


module.exports = new UrsaMu();