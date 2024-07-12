import {
  ProjectsEmitter,
  ProjectEvents,
  ProjectEventsPayloads
} from '@/modules/core/events/projectsEmitter'
import { getWorkspaceRolesFactory } from '@/modules/workspaces/repositories/workspaces'
import db from '@/db/knex'
import { grantStreamPermissions } from '@/modules/core/repositories/streams'
import { grantWorkspaceProjectRolesFactory } from '@/modules/workspaces/services/workspaceProjectRoleCreation'

async function onProjectCreated(
  payload: ProjectEventsPayloads[typeof ProjectEvents.Created]
) {
  const { id: projectId, workspaceId } = payload.project

  if (!workspaceId) {
    return
  }

  const grantWorkspaceProjectRoles = grantWorkspaceProjectRolesFactory({
    getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
    // TODO: Instantiate via factory function
    grantStreamPermissions
  })

  await grantWorkspaceProjectRoles({ projectId, workspaceId })
}

export function initializeEventListener() {
  const quitCbs = [ProjectsEmitter.listen(ProjectEvents.Created, onProjectCreated)]
  return () => quitCbs.forEach((quit) => quit())
}
