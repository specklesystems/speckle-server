import type { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'
import type {
  DeleteWorkspaceDomain,
  CountDomainsByWorkspaceId,
  UpdateWorkspace,
  GetWorkspaceBySlug,
  GetWorkspaceDomains
} from '@/modules/workspaces/domain/operations'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'

export const isUserWorkspaceDomainPolicyCompliantFactory =
  ({
    getWorkspaceBySlug,
    getWorkspaceDomains,
    findEmailsByUserId
  }: {
    getWorkspaceBySlug: GetWorkspaceBySlug
    getWorkspaceDomains: GetWorkspaceDomains
    findEmailsByUserId: FindEmailsByUserId
  }) =>
  async ({
    workspaceSlug,
    userId
  }: {
    workspaceSlug: string
    userId: string
  }): Promise<boolean | null> => {
    const workspace = await getWorkspaceBySlug({ workspaceSlug })
    if (!workspace) throw new WorkspaceNotFoundError()

    // if workspace is not protected, the value is not true, its an empty response
    if (!workspace.domainBasedMembershipProtectionEnabled) return null

    const workspaceDomains = await getWorkspaceDomains({ workspaceIds: [workspace.id] })

    const userEmails = await findEmailsByUserId({ userId })

    return userEmailsCompliantWithWorkspaceDomains({
      userEmails,
      workspaceDomains
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
