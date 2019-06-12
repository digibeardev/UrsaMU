


module.exports = parser => {

    // String functions

    // If statement logic.
    parser.funs.set('if', (args, scope) => {
        if (args.length < 2) {
            throw new SyntaxError('if expects at least 2 arguments')
        } else if (parser.evaluate(args[0], scope) !== false) {
            return parser.evaluate(args[1], scope)
        } else {
            return args[2] ? parser.evaluate(args[2], scope) : ''
        }
    })

        // Ifelse statement logic.
        parser.funs.set('ifelse', (args, scope) => {
            if (args.length !== 3) {
                throw new SyntaxError('ifelse expects 3 arguments')
            } else if (parser.evaluate(args[0], scope) !== false) {
                return parser.evaluate(args[1], scope)
            } else {
                return parser.evaluate(args[2], scope)
            }
        })

        // Center text
        parser.funs.set('center', (args, scope) =>{
            if (args.length < 2) {
                throw new SyntaxError('center requires at least 2 arguments')
            } else {
                const repeat = parseInt(args[1].value,10)
                // Check to see if the second arg is an integer
                if(Number.isInteger(repeat)) {
                    const length = (repeat - args[0].value.length)/2
                    return args[0].value.padStart(args[0].value.length)
                } else {
                    throw new SyntaxError('center expects length as a number.')
                }
            }
        })
    
    // Math

    // Add a comma sperated list of integers together.
    // if the arg doesn't pass parseInt().
    parser.funs.set('add', (args, scope) => {
        if (args.length < 2) {
            throw new SyntaxError('add expects at least 2 arguments')
        }
    
        let total = 0;
        args.forEach( arg => {
            let value = parseInt(parser.evaluate(arg, scope),10)
            if (Number.isInteger(value)) {
                total += value;
            }
        })
        return total.toString()
    })

    // Subtract two numbers.
    parser.funs.set('sub', (args, scope) => {
        if (args.length !== 2) {
            throw new SyntaxError('sub expects 2 arguments')
        }
    
        let num = parseInt(parser.evaluate(args[0], scope),10)
        let num2 = parseInt(parser.evaluate(args[1], scope),10)
    
        return (num - num2).toString()
    })

    // absolute value of an integer
    parser.funs.set('abs', (args, scope) => {
        if (args.length > 1) {
            throw new SyntaxError('abs expects 1 arguments')
        }
    
        let value = Number.parseInt(parser.evaluate(args[0], scope))
        if (Number.isInteger(value)) {
            return Math.abs(value).toString()
        } else {
            throw new SyntaxError('abs expects an interger')
        }
    })

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