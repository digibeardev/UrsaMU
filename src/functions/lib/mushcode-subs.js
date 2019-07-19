module.exports = mush => {
  mush.sub.set(/%s/g, "\xa0");

  // Color Codes foreground
  mush.sub.set(/%[cCxX]x/g, "\u001b[30m");
  mush.sub.set(/%[cCxX]r/g, "\u001b[31m");
  mush.sub.set(/%[cCxX]g/g, "\u001b[32m");
  mush.sub.set(/%[cCxX]y/g, "\u001b[33m");
  mush.sub.set(/%[cCxX]b/g, "\u001b[34m");
  mush.sub.set(/%[cCxX]m/g, "\u001b[35m");
  mush.sub.set(/%[cCxX]c/g, "\u001b[36m");
  mush.sub.set(/%[cCxX]w/g, "\u001b[37m");
  mush.sub.set(/%[cCxX]n/g, "\u001b[0m");

  // Highlight
  mush.sub.set(/%[cCxX]h/g, "\u001b[1m");

  // Background color codes
  mush.sub.set(/%[cCxX]X/g, "\u001b[40m");
  mush.sub.set(/%[cCxX]R/g, "\u001b[41m");
  mush.sub.set(/%[cCxX]G/g, "\u001b[42m");
  mush.sub.set(/%[cCxX]Y/g, "\u001b[43m");
  mush.sub.set(/%[cCxX]B/g, "\u001b[44m");
  mush.sub.set(/%[cCxX]M/g, "\u001b[45m");
  mush.sub.set(/%[cCxX]C/g, "\u001b[46m");
  mush.sub.set(/%[cCxX]W/g, "\u001b[47m");
};
