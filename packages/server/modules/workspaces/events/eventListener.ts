import {
  ProjectsEmitter,
  ProjectEvents,
  ProjectEventsPayloads
} from '@/modules/core/events/projectsEmitter'
import { getWorkspaceRolesFactory } from '@/modules/workspaces/repositories/workspaces'
import db from '@/db/knex'
import { grantStreamPermissions } from '@/modules/core/repositories/streams'
import { mapWorkspaceRoleToProjectRole } from '@/modules/workspaces/utils/mapWorkspaceRoleToProjectRole'

async function onProjectCreated(
  payload: ProjectEventsPayloads[typeof ProjectEvents.Created]
) {
  const { id: streamId, workspaceId } = payload.project

  if (!workspaceId) {
    return
  }

  // Assign project roles for all workspace members
  const workspaceMembers = await getWorkspaceRolesFactory({ db })({ workspaceId })

  await Promise.all(
    workspaceMembers.map(({ userId, role }) =>
      grantStreamPermissions({
        streamId,
        userId,
        role: mapWorkspaceRoleToProjectRole(role)
      })
    )
  )
}

export function initializeEventListener() {
  const quitCbs = [ProjectsEmitter.listen(ProjectEvents.Created, onProjectCreated)]

  return () => quitCbs.forEach((quit) => quit())
}
