import { GetWorkspaceRoles } from '@/modules/workspaces/domain/operations'
import { grantStreamPermissions as repoGrantStreamPermissions } from '@/modules/core/repositories/streams'
import { mapWorkspaceRoleToProjectRole } from '@/modules/workspaces/domain/roles'

type GrantWorkspaceProjectRolesArgs = {
  projectId: string
  workspaceId: string
}

export const grantWorkspaceProjectRolesFactory =
  ({
    getWorkspaceRoles,
    grantStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    grantStreamPermissions: typeof repoGrantStreamPermissions
  }) =>
  async ({ projectId, workspaceId }: GrantWorkspaceProjectRolesArgs) => {
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
