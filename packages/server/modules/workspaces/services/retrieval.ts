import {
  GetWorkspace,
  GetWorkspaceRolesForUser,
  GetWorkspaceRolesCount
} from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { chunk, isNull } from 'lodash'
import { getCostByWorkspaceRole } from '@/modules/workspaces/helpers/cost'

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
      const workspacesBatch = await Promise.all(
        workspaceRoleBatch.map(({ workspaceId }) => getWorkspace({ workspaceId }))
      )
      workspaces.push(
        ...workspacesBatch.filter(
          (workspace): workspace is Workspace => !isNull(workspace)
        )
      )
    }

    return workspaces
  }

export const getWorkspaceCost =
  ({ getWorkspaceRolesCount }: { getWorkspaceRolesCount: GetWorkspaceRolesCount }) =>
  async ({ workspaceId }: { workspaceId: string }) => {
    const countByRole = await getWorkspaceRolesCount({ workspaceId })
    return countByRole.reduce<number>(
      (acc, curr) => acc + curr.count * getCostByWorkspaceRole(curr.role),
      0
    ) as number
  }
