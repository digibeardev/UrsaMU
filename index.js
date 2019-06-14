const UrsaMu = require('./src/ursamu')
const app = new UrsaMu({plugins:'../plugins/mush-core/'})

app.parser.exe('help', app.parser.scope)