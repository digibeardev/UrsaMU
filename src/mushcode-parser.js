
// This parser is based off of an article I found on writing a
// scripting language with JavaScript.
// https://eloquentjavascript.net/12_language.html
class Parser {
    
    constructor() {
        this.funs = new Map()
        this.cmds = new Map()
        require('./mushcode-functions')(this)
    }

    // Break an expresison down into it's individual types.  Right now
    // it only supports 'word' which is really all mushcode needs.
    parseExpression(program) {
        let match, expr
        if (match  = /^[^(),]+/.exec(program)) {
            expr = {type:'word', value:match[0].trim()}
        }   else {
            throw new SyntaxError(`Unexpected Syntax: ${program}`)
        }
    
        return this.parseApply(expr,program.slice(match[0].length))
    }

    // Check the expression to see if it's a function call or not.
    parseApply(expr, program) {
        if (program[0] !== '(') {
            return {expr: expr, rest: program}
        }
    
        program = program.slice(1)
        expr = {type: 'apply', operator: expr, args: []}
        while (program[0] != ')') {
            let arg = this.parseExpression(program)
            expr.args.push(arg.expr)
            program = arg.rest
            
            if (program[0] === ',') {
                program = program.slice(1)
            } else if (program[0] != ')') {
                throw new SyntaxError("Expected ',' or ')'")
            }
        }
        return this.parseApply(expr, program.slice(1))
    }

    // Make sure an expression is being run, and not a random
    // string.
    parse(program) {
        let {expr, rest} = this.parseExpression(program);
        if (rest.length > 0) {
          throw new SyntaxError("Unexpected text after program");
        }
        return expr;
    }

    evaluate(expr, scope){
        // If the expression is a word, check to see if it has defined
        // meaning, else just return the value of the word.
        if (expr.type === 'word') {
            
            // Check to see if the expression has a value in scope, else 
            // just return the value of the expression.
            if (scope[expr.value]) {
                return scope[expr.value]
            } else {
                return expr.value
            }
    
        // If the expression type is 'apply', check to see if a function
        // exists that matches the expression word.
        } else if (expr.type === 'apply') {
            let {operator, args} = expr
            if (operator.type === 'word' && this.funs.has(operator.value) ) {
                return this.funs.get(operator.value)(args, scope)
            } else {
                throw SyntaxError('Not a defined function')
            }
        }
    }

    run(string, scope) {
        return this.evaluate(this.parse(string),scope)
    }
}

module.exports =  new Parser()