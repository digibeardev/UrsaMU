module.exports = mush => {
  (async () => {
    mush.stats.models.set("skill", {
      description: "No skill description set.",
      level: "D",
      LXP: 0,
      TPA: 0,
      category: "Other",
      example: "D200",
      ignore: ["description", "example", "category", "model", "value"],
      value: ({ stat }) => stat.level + stat.LXP
    });

    const results = await mush.stats.add([
      {
        model: "skill",
        name: "Swords",
        description: "Single handed short to long blades.",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Heavy Swords",
        description: "1 1/2 to 2 handed long blades, usually heavy",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Staves",
        description: "Bos, quarterstaff",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Hammers",
        description: "Hammers, Maces, Clubs.",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Axes",
        description: "Handheld axes both 1 and 2 handed.",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Knives",
        description: "Daggers, Combat Knives, Knives.",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Bows",
        description: "Long, Short and  Composite",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Darts",
        description: "Needles and Darts",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Whips",
        description: "Whips and Chains.",
        category: "weapon"
      },
      {
        model: "skill",
        name: "Spears",
        description: "Spears, Javelins, Halberds",
        category: "weapon"
      }
    ]);
    const { added, updated, failed } = results;
    mush.log.info(
      `Skill records inserted: ${added.length}. Updated: ${updated.length}. Failed: ${failed.length}.`
    );
  })().catch(error => mush.log.error(error));
};
