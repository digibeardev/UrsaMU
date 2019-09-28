module.exports = mush => {
  (async () => {
    mush.stats.model("attribute", {
      description: "No attribute description set.",
      level: "D",
      LXP: 0,
      TR: 0,
      category: "physical",
      example: "D200",
      value: ({ stat }) => stat.level + stat.LXP
    });

    const results = await mush.stats.add([
      {
        model: "attribute",
        name: "Brawn",
        description: "A rough rating of your strength"
      },
      {
        model: "attribute",
        name: "Grace",
        description: "A rough rating of your evasiveness, agility, stealth."
      },
      {
        model: "attribute",
        name: "Vitality",
        description: "A rough rating of how healthy you are."
      },
      {
        model: "attribute",
        name: "Mind",
        description: "A rough rating of your intelligence and wisdom.",
        category: "mental"
      },
      {
        model: "attribute",
        name: "Grit",
        description: "A rough rating of your conviction and your willpower.",
        category: "mental"
      },
      {
        model: "attribute",
        name: "Composure",
        description: "A rough rating of your ability to remain cool and calm.",
        category: "mental"
      },
      {
        model: "attribute",
        name: "Spirit",
        description: "A rough rating of your magical power.",
        category: "spiritual"
      },
      {
        model: "attribute",
        name: "Guile",
        description: "A rough rating of your charisma and manipulation.",
        category: "spiritual"
      },
      {
        model: "attribute",
        name: "Chakra",
        description: "A rough rating of how magically healthy you are.",
        category: "spiritual"
      },
      {
        model: "attribute",
        name: "Power",
        description: "Your default physical damage.",
        category: "derived",
        example: "(brawn + Vitality + Chakra)/3",
        value: async ({ player }) =>
          Math.round(
            (parseInt(await mush.stats.get(player, "attribute.brawn.LXP")) +
              parseInt(await mush.stats.get(player, "attribute.vitality.LXP")) +
              parseInt(await mush.stats.get(player, "attribute.chakra.LXP"))) /
              3
          ).toString()
      },
      {
        model: "attribute",
        name: "Focus",
        description: "Your default magical damage.",
        category: "derived",
        example: "(grace + spirit + mind)/3",
        value: async ({ player }) =>
          Math.round(
            (parseInt(await mush.stats.get(player, "attribute.grace.LXP")) +
              parseInt(await mush.stats.get(player, "attribute.spirit.LXP")) +
              parseInt(await mush.stats.get(player, "attribute.mind.LXP"))) /
              3
          ).toString()
      },
      {
        model: "attribute",
        name: "Finesse",
        description: "Your default evasion, speed, etc.",
        category: "derived",
        example: "(composure + guile + grit)/3",
        value: async ({ player }) =>
          Math.round(
            (parseInt(await mush.stats.get(player, "attribute.composure.LXP")) +
              parseInt(await mush.stats.get(player, "attribute.guile.LXP")) +
              parseInt(await mush.stats.get(player, "attribute.grit.LXP"))) /
              3
          ).toString()
      }
    ]);

    const { added, updated, failed } = results;
    mush.log.info(
      `Stats records inserted: ${added.length}. Updated: ${updated.length}. Failed: ${failed.length}.`
    );
  })(mush).catch(error => mush.log.error(error));
};
