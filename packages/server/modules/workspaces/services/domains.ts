import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'
import {
  GetWorkspaceWithDomains,
  DeleteWorkspaceDomain,
  CountDomainsByWorkspaceId,
  UpdateWorkspace
} from '@/modules/workspaces/domain/operations'
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

export const deleteWorkspaceDomainFactory =
  ({
    deleteWorkspaceDomain,
    countDomainsByWorkspaceId,
    updateWorkspace
  }: {
    deleteWorkspaceDomain: DeleteWorkspaceDomain
    countDomainsByWorkspaceId: CountDomainsByWorkspaceId
    updateWorkspace: UpdateWorkspace
  }) =>
  async ({ workspaceId, domainId }: { workspaceId: string; domainId: string }) => {
    await deleteWorkspaceDomain({ id: domainId })

    const domainsCount = await countDomainsByWorkspaceId({ workspaceId })
    if (domainsCount === 0) {
      await updateWorkspace({
        workspaceId,
        workspaceInput: {
          domainBasedMembershipProtectionEnabled: false,
          discoverabilityEnabled: false
        }
      })
    }
  }
