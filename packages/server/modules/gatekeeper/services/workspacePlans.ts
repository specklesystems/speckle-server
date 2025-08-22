import type {
  GetWorkspacePlan,
  GetWorkspaceSubscription,
  UpsertWorkspacePlan
} from '@/modules/gatekeeper/domain/billing'
import {
  InvalidWorkspacePlanStatus,
  WorkspacePlanNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import type { GetWorkspace } from '@/modules/workspaces/domain/operations'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import type { WorkspacePlan } from '@speckle/shared'
import {
  throwUncoveredError,
  WorkspaceFeatureFlags,
  WorkspacePlans
} from '@speckle/shared'

export const updateWorkspacePlanFactory =
  ({
    getWorkspace,
    upsertWorkspacePlan,
    getWorkspacePlan,
    getWorkspaceSubscription,
    emitEvent
  }: {
    getWorkspace: GetWorkspace
    // im using the generic function here, cause the service is
    // responsible for protecting the permutations
    upsertWorkspacePlan: UpsertWorkspacePlan
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    emitEvent: EventBusEmit
  }) =>
  async ({
    userId,
    workspaceId,
    name,
    status
  }: Pick<WorkspacePlan, 'workspaceId' | 'name' | 'status'> & {
    userId: string | null
  }): Promise<void> => {
    const workspace = await getWorkspace({
      workspaceId
    })
    if (!workspace) throw new WorkspaceNotFoundError()
    let workspacePlan: WorkspacePlan
    const previousWorkspacePlan = await getWorkspacePlan({ workspaceId })
    if (!previousWorkspacePlan) throw new WorkspacePlanNotFoundError()
    const workspaceSubscription = await getWorkspaceSubscription({ workspaceId })

    const createdAt = new Date()
    const updatedAt = new Date()
    switch (name) {
      case WorkspacePlans.Team:
      case WorkspacePlans.TeamUnlimited:
      case WorkspacePlans.Pro:
      case WorkspacePlans.ProUnlimited:
        switch (status) {
          case 'valid':
          case 'cancelationScheduled':
          case 'canceled':
          case 'paymentFailed':
            workspacePlan = {
              workspaceId,
              status,
              name,
              createdAt,
              updatedAt,
              featureFlags: WorkspaceFeatureFlags.None
            }
            await upsertWorkspacePlan({ workspacePlan })
            break
          default:
            throwUncoveredError(status)
        }
        break

      case WorkspacePlans.Free:
      case WorkspacePlans.Academia:
      case WorkspacePlans.Unlimited:
      case WorkspacePlans.Enterprise:
      case WorkspacePlans.TeamUnlimitedInvoiced:
      case WorkspacePlans.ProUnlimitedInvoiced:
        switch (status) {
          case 'valid':
            if (workspaceSubscription) throw new InvalidWorkspacePlanStatus()

            workspacePlan = {
              workspaceId,
              status,
              name,
              createdAt,
              updatedAt,
              featureFlags: WorkspaceFeatureFlags.None
            }
            await upsertWorkspacePlan({ workspacePlan })
            break
          case 'cancelationScheduled':
          case 'canceled':
          case 'paymentFailed':
            throw new InvalidWorkspacePlanStatus()
          default:
            throwUncoveredError(status)
        }
        break
      default:
        throwUncoveredError(name)
    }

    await emitEvent({
      eventName: GatekeeperEvents.WorkspacePlanUpdated,
      payload: {
        userId,
        workspacePlan,
        previousWorkspacePlan
      }
    })
  }
