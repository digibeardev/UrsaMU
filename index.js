const parser = require('./src/mushcode-parser')



const scope = {}
console.log(parser.run(`center(This is the fuckin' best!,78,=)`, scope))