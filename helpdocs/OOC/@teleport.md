# @teleport

COMMAND: @teleport [`<object>`=] `<room/thing>`
         @teleport [`<object>`=] `<exit>`
         @teleport [`<object>`=] home

The first form of the @teleport command moves `<object> `(or you) to the named
room or thing.  The second form sends `<object>` (or you) to the destination
of the named exit, while the third form sends `<object>` (or you) home.
If the destination room has a drop-to, the object will go to the drop-to
instead of the named location.

For the first form of the @teleport command, the object being teleported
must pass its location's TeloutLock; and you must control the destination,
or it must be JUMP_OK and you must pass the destination's TportLock.

The second and third forms let you remove any object from locations you
control by sending them through an exit or to their home.

The following switches are available:
   /quiet - Teleports without setting off success or failure messages.
   /list  - Interpret `<object>` as a space-delimited list of objects.

Related Topics: JUMP_OK, @lock (TportLock and TeloutLock), @tfail, @otfail,
    @atfail, @tofail, @otofail, @atofail.
