# @alias

COMMAND:   `@alias <player> = <name>`
ATTRIBUTE: Alias

Provides an alternate name by which the player is known.  The alternate
name is only used by commands that only take playernames (such as page or @stats.  You may not set an alias on any other object type.

When setting an alias, the alias is checked to see that it is both a legal player name and not already in use.  Only if both checks succeed is the alias set.

Related Topics: [@name](@name.md).
