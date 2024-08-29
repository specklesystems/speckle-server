import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'
import { GetWorkspaceWithDomains } from '@/modules/workspaces/domain/operations'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'

export const isUserWorkspaceDomainPolicyCompliantFactory =
  ({
    getWorkspaceWithDomains,
    findEmailsByUserId
  }: {
    getWorkspaceWithDomains: GetWorkspaceWithDomains
    findEmailsByUserId: FindEmailsByUserId
  }) =>
  async ({
    workspaceId,
    userId
  }: {
    workspaceId: string
    userId: string
  }): Promise<boolean | null> => {
    const workspace = await getWorkspaceWithDomains({
      id: workspaceId
    })
    // maybe we should throw
    if (!workspace) throw new WorkspaceNotFoundError()

    // if workspace is not protected, the value is not true, its an empty response
    if (!workspace.domainBasedMembershipProtectionEnabled) return null

    const userEmails = await findEmailsByUserId({ userId })

    return userEmailsCompliantWithWorkspaceDomains({
      userEmails,
      workspaceDomains: workspace.domains
    })
  }
