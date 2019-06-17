module.exports = parser => {
    // Misc functions

    // Set a variable to be used within the expression.
    parser.funs.set('set',(args, scope) => {
        if (args.length !== 2) {
            throw new SyntaxError('Set expects 2 arguments')
        }
    
        let value = parser.evaluate(args[1], scope)
        scope[args[0].value] = value
        return value
    })
}