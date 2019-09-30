module.exports = mush => {
  mush.stats.model("skill", {
    description: "No attribute description set.",
    level: "D",
    LXP: 0,
    TR: 0,
    category: "physical",
    example: "D200",
    value: ({ stat }) => stat.level + stat.LXP
  });
};
