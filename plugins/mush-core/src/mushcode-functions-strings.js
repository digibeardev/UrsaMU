

const stripAnsi = require('strip-ansi')
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

        
        // In order to keep things DRY, creating a function expression to render filler strings.
        const repeatString = (string, length) => {
            // Check to see if the filler string contains ansii substitutions.  If so
            // split the characters of the string into an array and apply ansii substitutions.
            // Else just split the filler string into an array. 

            // check how many spaces are left after the filler string is rendered. We will need
            // to render these last few spaces manually.
            const remainder = Math.floor(length % parser.stripSubs(string).length)

            // Split the array and filter out empty cells.
            let cleanArray = string.split('%').filter(Boolean)
            // If the array length is longer than 1 (more then one cell), process for ansii
            if(cleanArray.length > 1) {

                // If it's just a clear formatting call 'cn' then we don't need to worry
                // about it.  We'll handle making sure ansii is cleared after each substitution manually.
                cleanArray = cleanArray.filter(cell => {
                    if (cell.toLowerCase() !== 'cn') {
                        return cell
                    }
                })

                // fire the substitutions on each cell.
                .map(cell => {
                    return parser.subs('%'+cell+'%cn')
                })
            } else {
                cleanArray = cleanArray[0].split('')
            }
            return string.repeat(length/parser.stripSubs(string).length) + cleanArray.slice(0,remainder)
        } 

        // Center text.
        parser.funs.set('center', (args, scope) =>{
            if (args.length < 2) {
                throw new SyntaxError('center requires at least 2 arguments')
            } else {
                

                const message = parser.evaluate(args[0], scope)
                const width = parseInt(parser.evaluate(args[1], scope),10)
                const repeat = parser.evaluate(args[2], scope) ? parser.evaluate(args[2], scope) : ' '
                
                // Check to see if the second arg is an integer
                if(Number.isInteger(width)) {
                    // run the substitutions so I can strip away the ansi non-printables
                    // while still retaining any spaces around the message.
                    const length = (width - parser.stripAnsi(parser.subs(message)).length)/2
                    const remainder = (width - parser.stripSubs(message).length) % 2
            
                    return (
                        repeatString(repeat,length) + 
                        message + 
                        repeatString(repeat,length + remainder)
                    )
                } else {
                    throw new SyntaxError('center expects length as a number.')
                }
            }
        })


        // left justification
        parser.funs.set('ljust', (args, scope) => {
            const message = parser.evaluate(args[0], scope)
            const filler = parser.evaluate(args[2], scope) ? parser.evaluate(args[2], scope) : ' '
            const width = parseInt(parser.evaluate(args[1], scope))
            
            // Check to make sure we have the right number of arguments.
            if (args.length < 2) {
                return SyntaxError('ljust requres at least 2 arguments')
            }
            
            // If width is an integer format the string to width using
            // filler to fill empty spaces.
            if (Number.isInteger(width)) {
                const length = width - parser.stripAnsi(parser.subs(message)).length
                return message + repeatString(filler, length)
            }
        })

        
        // left justification
        parser.funs.set('rjust', (args, scope) => {
            const message = parser.evaluate(args[0], scope)
            const filler = parser.evaluate(args[2], scope) ? parser.evaluate(args[2], scope) : ' '
            const width = parseInt(parser.evaluate(args[1], scope))
            
            // Check to make sure we have the right number of arguments.
            if (args.length < 2) {
                return SyntaxError('ljust requres at least 2 arguments')
            }
            
            // If width is an integer format the string to width using
            // filler to fill empty spaces.
            if (Number.isInteger(width)) {
                const length = width - parser.stripAnsi(parser.subs(message)).length
                return repeatString(filler, length) + message
            }
        })

    // repeat()    
    parser.funs.set('repeat', (args, scope) => {
        if (args.length < 2) {
            return SyntaxError('repeat expects 2 arguments')
        }
        const message = parser.evaluate(args[0], scope)
        const width = parseInt(parser.evaluate(args[1], scope))
        if (Number.isInteger(width)) {
            return message.repeat(width)
        }
    })
}