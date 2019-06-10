// This parser is based off of an article I found on writing a
// scripting language with JavaScript.
// https://eloquentjavascript.net/12_language.html

const parseExpression = program => {
    let match, expr
    if (match  = /^[^(),]+/.exec(program)) {
        expr = {type:'word', value:match[0].trim()}
    }   else {
        throw new SyntaxError(`Unexpected Syntax: ${program}`)
    }

    return parseApply(expr,program.slice(match[0].length))
}

const parseApply = (expr, program) => {
    if (program[0] !== '(') {
        return {expr: expr, rest: program}
    }

    program = program.slice(1)
    expr = {type: 'apply', operator: expr, args: []}
    while (program[0] != ')') {
        let arg = parseExpression(program)
        expr.args.push(arg.expr)
        program = arg.rest
        
        if (program[0] === ',') {
            program = program.slice(1)
        } else if (program[0] != ')') {
            throw new SyntaxError("Expected ',' or ')'")
        }
    }
    return parseApply(expr, program.slice(1))
}

const parse = program => {
    let {expr, rest} = parseExpression(program)
    if (rest.length > 0) {
        throw new SyntaxError('Unexpected text after expression')
    }
    return expr
}

// Create an object for core game functions
const specialForms = {}
const scope = {}

const evaluate = (expr, scope) => {
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
        if (operator.type === 'word' && operator.value in specialForms) {
            return specialForms[operator.value](expr.args, scope)
        } else {
            throw SyntaxError('Not a defined function')
        }
    }
}


specialForms.if = (args, scope) => {
    if (args.length !== 3) {
        throw new SyntaxError('If expects 3 arguments')
    } else if (evaluate(args[0], scope) !== false) {
        return evaluate(args[1], scope)
    } else {
        return evaluate(args[2], scope)
    }
}

specialForms.set = (args, scope) => {
    if (args.length !== 2) {
        throw new SyntaxError('Set expects 2 arguments')
    }

    let value = evaluate(args[1], scope)
    scope[args[0].value] = value
    return value
}


console.log(evaluate(parse('if(set(a,5),a,false)'), scope))