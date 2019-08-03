# @Alias

COMMAND:   @alias \<player> = \<name>

ATTRIBUTE: **Alias**

SYNTAX: @alias me=alias

Provides an alternate name by which the player is known.  The alternate name is only used for players when referenced as '*\<name>' or by commands that only take playernames (such a page or @stats).  You may not set an alias on any other object type.

When setting an alias, the alias is checked to see that it is both a legal player name and not already in use.  Only if both checks succeed is the alias set.

Related Topics: [@name](@name)