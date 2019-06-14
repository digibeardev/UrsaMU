module.exports = parser => {
    
    parser.cmds.set('help', {
        pattern: /^\+?help/,
        run: args => {
            return console.log('We have a command!!')
        }
    })
}