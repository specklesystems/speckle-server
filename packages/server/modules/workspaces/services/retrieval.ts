import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import {
  GetUserDiscoverableWorkspaces,
  GetWorkspace,
  GetWorkspaceRolesForUser
} from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { chunk, isNull } from 'lodash'

type GetDiscoverableWorkspaceForUserArgs = {
  userId: string
}

export const getDiscoverableWorkspacesForUserFactory =
  ({
    findEmailsByUserId,
    getDiscoverableWorkspaces
  }: {
    findEmailsByUserId: FindEmailsByUserId
    getDiscoverableWorkspaces: GetUserDiscoverableWorkspaces
  }) =>
  async ({
    userId
  }: GetDiscoverableWorkspaceForUserArgs): Promise<
    Pick<Workspace, 'id' | 'name' | 'slug' | 'description' | 'logo'>[]
  > => {
    const userEmails = await findEmailsByUserId({ userId })
    const userVerifiedDomains = userEmails
      .filter((email) => email.verified)
      .map((email) => email.email.split('@')[1])
    const workspaces = await getDiscoverableWorkspaces({
      domains: userVerifiedDomains,
      userId
    })

    return workspaces
  }

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
