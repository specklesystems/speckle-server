import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import {
  GetUserDiscoverableWorkspaces,
  GetWorkspaceRolesForUser,
  GetWorkspaces
} from '@/modules/workspaces/domain/operations'
import { Workspace } from '@/modules/workspacesCore/domain/types'

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
  completed?: boolean
  search?: string
}

export const getWorkspacesForUserFactory =
  ({
    getWorkspaces,
    getWorkspaceRolesForUser
  }: {
    getWorkspaces: GetWorkspaces
    getWorkspaceRolesForUser: GetWorkspaceRolesForUser
  }) =>
  async ({
    userId,
    completed,
    search
  }: GetWorkspacesForUserArgs): Promise<Workspace[]> => {
    const workspaceRoles = await getWorkspaceRolesForUser({ userId })

    const workspaceIds = workspaceRoles.map((workspace) => {
      return workspace.workspaceId
    })
    const workspaces = await getWorkspaces({ workspaceIds, completed, search })

    return workspaces
  }
