# How I suggest we move forward within the scope of this ticket

1. First build out workspace invites the old way - with direct imports and coupling serverInvites
   to workspaces
2. Once that's done and we know what the logic is supposed to be, we refactor all of that to use
   the approach that we decide on, whether its the Shared API or Events+Filters or a combination of both
   or something else entirely
