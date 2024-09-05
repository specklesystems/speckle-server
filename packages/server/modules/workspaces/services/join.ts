import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { EventBus } from '@/modules/shared/services/eventBus'
import {
  GetWorkspaceWithDomains,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceJoinNotAllowedError,
  WorkspaceNotDiscoverableError,
  WorkspaceNotJoinableError
} from '@/modules/workspaces/errors/workspace'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Roles } from '@speckle/shared'

export const joinWorkspaceFactory =
  ({
    getUserEmails,
    getWorkspaceWithDomains,
    upsertWorkspaceRole,
    emitWorkspaceEvent
  }: {
    getUserEmails: FindEmailsByUserId
    getWorkspaceWithDomains: GetWorkspaceWithDomains
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EventBus['emit']
  }) =>
  async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
    const userEmails = await getUserEmails({ userId })
    const workspace = await getWorkspaceWithDomains({ id: workspaceId })
    if (!workspace?.discoverabilityEnabled) throw new WorkspaceNotDiscoverableError()

    const workspaceDomains = workspace.domains.filter((domain) => domain.verified)

    if (!workspaceDomains.length) throw new WorkspaceNotJoinableError()

    const matchingEmail = userEmails.find((userEmail) => {
      if (!userEmail.verified) return false
      return workspaceDomains
        .map((domain) => domain.domain)
        .includes(userEmail.email.split('@')[1])
    })

    if (!matchingEmail) throw new WorkspaceJoinNotAllowedError()

    const role = Roles.Workspace.Member
    await upsertWorkspaceRole({ userId, workspaceId, role, createdAt: new Date() })
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.JoinedFromDiscovery,
      payload: { userId, workspaceId, role }
    })
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.RoleUpdated,
      payload: { userId, workspaceId, role }
    })
  }
