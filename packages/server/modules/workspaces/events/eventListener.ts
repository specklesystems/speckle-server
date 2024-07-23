import {
  ProjectsEmitter,
  ProjectEvents,
  ProjectEventsPayloads
} from '@/modules/core/events/projectsEmitter'
import { getWorkspaceRolesFactory } from '@/modules/workspaces/repositories/workspaces'
import { grantStreamPermissions as repoGrantStreamPermissions } from '@/modules/core/repositories/streams'
import { Knex } from 'knex'
import { GetWorkspaceRoles } from '@/modules/workspaces/domain/operations'
import { mapWorkspaceRoleToProjectRole } from '@/modules/workspaces/helpers/roles'

export const onProjectCreatedFactory =
  ({
    getWorkspaceRoles,
    grantStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    grantStreamPermissions: typeof repoGrantStreamPermissions
  }) =>
  async (payload: ProjectEventsPayloads[typeof ProjectEvents.Created]) => {
    const { id: projectId, workspaceId } = payload.project

    if (!workspaceId) {
      return
    }

    const workspaceMembers = await getWorkspaceRoles({ workspaceId })

    await Promise.all(
      workspaceMembers.map(({ userId, role: workspaceRole }) =>
        grantStreamPermissions({
          streamId: projectId,
          userId,
          role: mapWorkspaceRoleToProjectRole(workspaceRole)
        })
      )
    )
  }

export const initializeEventListenersFactory =
  ({ db }: { db: Knex }) =>
  () => {
    const onProjectCreated = onProjectCreatedFactory({
      getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
      // TODO: Instantiate via factory function
      grantStreamPermissions: repoGrantStreamPermissions
    })

    const quitCbs = [ProjectsEmitter.listen(ProjectEvents.Created, onProjectCreated)]

    return () => quitCbs.forEach((quit) => quit())
  }
