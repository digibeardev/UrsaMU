module.exports = app => {
    app.parser = require('./src/mushcode-parser')
    require('./src/mushcode-functions-strings')(app.parser)
    require('./src/mushcode-functions-math')(app.parser)
    require('./src/muschode-functions-misc')(app.parser)
    require('./src/mushcode-subs')(app.parser)
    require('./src/mushcode-cmd-help')(app.parser)
}