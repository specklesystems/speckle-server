import {
  GetWorkspacePlan,
  UpsertWorkspacePlan
} from '@/modules/gatekeeper/domain/billing'
import { InvalidWorkspacePlanStatus } from '@/modules/gatekeeper/errors/billing'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { GetWorkspace } from '@/modules/workspaces/domain/operations'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { throwUncoveredError, WorkspacePlan, WorkspacePlans } from '@speckle/shared'

export const updateWorkspacePlanFactory =
  ({
    getWorkspace,
    upsertWorkspacePlan,
    getWorkspacePlan,
    emitEvent
  }: {
    getWorkspace: GetWorkspace
    // im using the generic function here, cause the service is
    // responsible for protecting the permutations
    upsertWorkspacePlan: UpsertWorkspacePlan
    getWorkspacePlan: GetWorkspacePlan
    emitEvent: EventBusEmit
  }) =>
  async ({
    workspaceId,
    name,
    status
  }: Pick<WorkspacePlan, 'workspaceId' | 'name' | 'status'>): Promise<void> => {
    const workspace = await getWorkspace({
      workspaceId
    })
    if (!workspace) throw new WorkspaceNotFoundError()
    const previousPlan = await getWorkspacePlan({ workspaceId })
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
            await upsertWorkspacePlan({
              workspacePlan: { workspaceId, status, name, createdAt, updatedAt }
            })
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
            await upsertWorkspacePlan({
              workspacePlan: { workspaceId, status, name, createdAt, updatedAt }
            })
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
      eventName: 'gatekeeper.workspace-plan-updated',
      payload: {
        workspacePlan: {
          name,
          status,
          workspaceId
        },
        ...(previousPlan && {
          previousPlan: { name: previousPlan.name }
        })
      }
    })
  }
