# delcom

COMMAND: delcom `<alias>`

Deletes `<alias>` from your list of channel aliases. If the `<alias>` was the
only alias for the channel, then the channel has now been effectively
removed. In order to use that channel again, you will need to re-add the
channel with the 'addcom' command. If you only wish to have the channel
quiet for a time, then a better command is '`<alias> `off'.

Example:
  >delcom pub
  Channel Public deleted.

Related Topics: addcom, alias, comlist, clearcom.
