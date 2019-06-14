const fs = require('fs')
const _ = require('lodash')

module.exports = class HelpSystem {
    constructor(options) {
        const { cmds, funs } = options
        this.cmds = cmds ? cmds : [] // Array of command names
        this.funs = funs ? funs : [] // Array of function names
        this.entries = require('../data/helpfile.json') 
        this.init()       
    }

    // Initiate the help system.  Check for new commands and
    // and functions then add them to the list. 
    init() {
        this.cmds.forEach( cmd => {
            if (!(cmd in this.entries.cmds)) {
                this.entries.cmds.push({name: cmd.name})
            }
        })

        this.funs.forEach( fun => {
            if (!(fun in this.entries.funs)) {
                this.entries.funs.push({name: fun})
            }
        })
    }




}