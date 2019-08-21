# @addcom

COMMAND: addcom `<alias>`=`<channel>`

The alias and the channel name are case sensitive.

Using this command, you can join a pre-existing channel by specifying the
alias you wish to use. If the channel is named 'Public', then you must type
it with the same case. Likewise the alias is case sensitive. If you use
'addcom Pub=Public', then to use the channel you must type 'Pub Hello'
instead of 'pub Hello'.

One other thing to be careful of: adding a channel multiple times with
different aliases.  While possible, it can be confusing.

Example:
  >addcom pub=Public
  Channel Public added with alias pub.

Related Topics: delcom, @clist, comlist, alias, comtitle.
