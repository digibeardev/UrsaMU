
module.exports = parser => {
    parser.sub.set(/%s/g, '\xa0')


    // Color Codes foreground
    parser.sub.set(/%[cCxX]x/g, '\u001b[30m')
    parser.sub.set(/%[cCxX]r/g, '\u001b[31m')
    parser.sub.set(/%[cCxX]g/g, '\u001b[32m')
    parser.sub.set(/%[cCxX]y/g, '\u001b[33m')
    parser.sub.set(/%[cCxX]b/g, '\u001b[34m')
    parser.sub.set(/%[cCxX]m/g, '\u001b[35m')
    parser.sub.set(/%[cCxX]c/g, '\u001b[36m')
    parser.sub.set(/%[cCxX]w/g, '\u001b[37m')
    parser.sub.set(/%[cCxX]n/g, '\u001b[0m')

    // Highlight
    parser.sub.set(/%[cCxX]h/g, '\u001b[1m')

    // Background color codes
    parser.sub.set(/%[cCxX]X/g, '\u001b[40m')
    parser.sub.set(/%[cCxX]R/g, '\u001b[41m')
    parser.sub.set(/%[cCxX]G/g, '\u001b[42m')
    parser.sub.set(/%[cCxX]Y/g, '\u001b[43m')
    parser.sub.set(/%[cCxX]B/g, '\u001b[44m')
    parser.sub.set(/%[cCxX]M/g, '\u001b[45m')
    parser.sub.set(/%[cCxX]C/g, '\u001b[46m')
    parser.sub.set(/%[cCxX]W/g, '\u001b[47m')
}