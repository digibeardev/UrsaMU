# @stats

COMMANDS

* `@stats` - See the available stats
* `@stats/info <stat>` - View specific details of a stat.
* `@stat/add <model>=<stat Name>` - Add a new stat to the system based on `<model>`.
* `@stat/update <stat>/<substat> = <value>` - Edit the default values. 
* `@stats/set <player>/<stat path> = <value>` - Set a stat on a player.  Stat path is in dot notation as the following `<stat>.<substat>`
* `@stat/get <player>/<stat>` - Get a formatted representation of a player stat.

Each Stat is represented by a model.  A way of shaping what the data of a stat should look like.  This will vary from game to game.  More information on models can be found on the [website](#).

## EXAMPLES

**Adding A new Stat**


`@stat/new Attribute = Brawn`
`@stat/update Brawn/description = A rough rating of your strength`


**Setting a player stat**

`@stat/set Kumakun/Brawl.LXP = 50`
`@stat/get Kumakun/Brawl` // -> "50D"
