import type { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import type { UserEmail } from '@/modules/core/domain/userEmails/types'
import type {
  GetUserDiscoverableWorkspaces,
  GetUsersCurrentAndEligibleToBecomeAMemberWorkspaces,
  GetWorkspaceRolesForUser,
  GetWorkspaces
} from '@/modules/workspaces/domain/operations'
import type { LimitedWorkspace, Workspace } from '@/modules/workspacesCore/domain/types'

type GetDiscoverableWorkspaceForUserArgs = {
  userId: string
}

const getUserVerifiedDomains = (userEmails: UserEmail[]): string[] =>
  userEmails.filter((email) => email.verified).map((email) => email.email.split('@')[1])

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
  }: GetDiscoverableWorkspaceForUserArgs): Promise<LimitedWorkspace[]> => {
    const userEmails = await findEmailsByUserId({ userId })
    const userVerifiedDomains = getUserVerifiedDomains(userEmails)
    const workspaces = await getDiscoverableWorkspaces({
      domains: userVerifiedDomains,
      userId
    })

    return workspaces
  }

export const getUsersCurrentAndEligibleToBecomeAMemberWorkspaces =
  ({
    findEmailsByUserId,
    getUserEligibleWorkspaces
  }: {
    findEmailsByUserId: FindEmailsByUserId
    getUserEligibleWorkspaces: GetUsersCurrentAndEligibleToBecomeAMemberWorkspaces
  }) =>
  async ({
    userId
  }: GetDiscoverableWorkspaceForUserArgs): Promise<LimitedWorkspace[]> => {
    const userEmails = await findEmailsByUserId({ userId })
    const userVerifiedDomains = getUserVerifiedDomains(userEmails)
    const workspaces = await getUserEligibleWorkspaces({
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
