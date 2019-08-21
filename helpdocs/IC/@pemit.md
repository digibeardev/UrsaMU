# @pemit

COMMAND: @pemit[/switches] `<what>`=`<message>`

Emits `<message>` only to `<what>`, or to `<what>`'s contents of the /contents
switch is given.  `<what>` must be either in the same location as you or be
something you own.  Depending on how this MUX is configured, you can also
@pemit to distant players if pagelocks allow you to page them, and this
costs as much as a page.  You cannot @pemit to the contents of something
you don't own.

The /list switch to this command allows you to @pemit a message to
a list:  @pemit/list <object 1> [<object 2> <object N>] = <message>
There can be any number of objects in the list.  This can be combined with
other switches.

The following switches are also available:

  /contents - Send the message to the contents of the named object.
  /html     - Send the message in HTML format (Pueblo).
  /noeval   - Do not parse the message.
  /object   - Send the message to the named object.

Related Topics: page, @remit, @emit, @oemit, SPOOFING.
