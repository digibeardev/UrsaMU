# @set continued...

The following flags may be set using the fourth form of the @set command:

   case       - $-command matching will not be case-sensitive.
                Non-functional unless the 'R' flag is also set.
   hidden     - The attribute is only visible to wizards.
   html       - Emits from attr, oattr, aattr are not HTML-escaped.
   no_command - Prevent $-commands and ^-patterns defined in the attribute
                from being performed.
   no_inherit - Prevents children of the object from obtaining the
                attribute.  From their perspective, the attribute does not
                exist.
   no_name    - If set on an @o-attr, don't prepend the name of the
                enactor.  This also affects @verb behavior.
   regexp     - When $-commands are matched, treat the pattern as a
                regular expression rather than a wildcard glob pattern.
   trace      - The attribute will generate trace output.
   visual     - Anyone may see the attribute when they examine you, and
                may get the attribute with get().
   wizard     - The attribute may only be changed by wizards.

The @set command takes the following switch:

   quiet      - Inhibit 'Set.' acknowledgement messages.

Related Topics: ATTRIBUTE FLAGS, @lock, @lock, examine, FLAGS, &.
