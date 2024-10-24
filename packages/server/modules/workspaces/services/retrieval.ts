import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import {
  decodeIsoDateCursor,
  encodeIsoDateCursor
} from '@/modules/shared/helpers/graphqlHelper'
import {
  GetUserDiscoverableWorkspaces,
  GetWorkspace,
  GetWorkspaceCollaborators,
  GetWorkspaceCollaboratorsArgs,
  GetWorkspaceCollaboratorsTotalCount,
  GetWorkspaceRolesForUser
} from '@/modules/workspaces/domain/operations'
import { WorkspaceTeam } from '@/modules/workspaces/domain/types'
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
    Pick<
      Workspace,
      'id' | 'name' | 'slug' | 'description' | 'logo' | 'defaultLogoIndex'
    >[]
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

type WorkspaceTeamCollection = {
  items: WorkspaceTeam
  cursor: string | null
  totalCount: number
}

export const getPaginatedWorkspaceTeamFactory =
  ({
    getWorkspaceCollaborators,
    getWorkspaceCollaboratorsTotalCount
  }: {
    getWorkspaceCollaborators: GetWorkspaceCollaborators
    getWorkspaceCollaboratorsTotalCount: GetWorkspaceCollaboratorsTotalCount
  }) =>
  async (args: GetWorkspaceCollaboratorsArgs): Promise<WorkspaceTeamCollection> => {
    const maybeDecodedCursor = args.cursor ? decodeIsoDateCursor(args.cursor) : null
    const items = await getWorkspaceCollaborators({
      ...args,
      cursor: maybeDecodedCursor ?? undefined
    })
    const totalCount = await getWorkspaceCollaboratorsTotalCount(args)

    let cursor = null
    if (items.length === args.limit) {
      const lastItem = items.at(-1)
      cursor = lastItem ? encodeIsoDateCursor(lastItem.createdAt) : null
    }

    return {
      items,
      cursor,
      totalCount
    }
  }
