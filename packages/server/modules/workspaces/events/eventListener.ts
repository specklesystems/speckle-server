import {
  ProjectsEmitter,
  ProjectEvents,
  ProjectEventsPayloads
} from '@/modules/core/events/projectsEmitter'
import { getWorkspaceMembersFactory } from '@/modules/workspaces/repositories/workspaces'
import db from '@/db/knex'
import { grantStreamPermissions } from '@/modules/core/repositories/streams'

async function onProjectCreated(
  payload: ProjectEventsPayloads[typeof ProjectEvents.Created]
) {
  const { id: streamId, workspaceId } = payload.project

  if (!workspaceId) {
    return
  }

  // Assign project roles for all workspace members
  const workspaceMembers = await getWorkspaceMembersFactory({ db })({
    workspaceId,
    // Do not grant project roles to guests
    // TODO: Viewer roles?
    roles: ['workspace:admin', 'workspace:member']
  })

  await Promise.all(
    workspaceMembers.map(({ userId }) =>
      grantStreamPermissions({ streamId, userId, role: 'stream:reviewer' })
    )
  )
}

export function initializeEventListener() {
  const quitCbs = [ProjectsEmitter.listen(ProjectEvents.Created, onProjectCreated)]

  return () => quitCbs.forEach((quit) => quit())
}
