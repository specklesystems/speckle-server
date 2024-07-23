import {
  GetWorkspace,
  GetWorkspaceRolesForUser
} from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { chunk } from 'lodash'

type GetWorkspacesForUserArgs = {
  userId: string
}

export const getWorkspacesForUserFactory =
  ({
    getWorkspace,
    getWorkspaceRolesForUser
  }: {
    getWorkspace: GetWorkspace
    getWorkspaceRolesForUser: GetWorkspaceRolesForUser
  }) =>
  async ({ userId }: GetWorkspacesForUserArgs): Promise<Workspace[]> => {
    const workspaceRoles = await getWorkspaceRolesForUser({ userId })

    const workspaces: Workspace[] = []

    for (const workspaceRoleBatch of chunk(workspaceRoles, 20)) {
      // TODO: Use `getWorkspaces`, which I saw Fabians already wrote in another PR
      const workspaces = await Promise.all(
        workspaceRoleBatch.map(({ workspaceId }) => getWorkspace({ workspaceId }))
      )
      workspaces.push(...workspaces.filter((workspace) => !!workspace))
    }

    return workspaces
  }
