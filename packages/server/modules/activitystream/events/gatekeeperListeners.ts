import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { SaveActivity } from '@/modules/activitystream/domain/operations'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'
import {
  WorkspacePlanUpdatedActivity,
  WorkspaceSubscriptionUpdatedActivity
} from '@/modules/activitystream/domain/types'
import { isEqual } from 'lodash'

const addWorkspacePlanUpdatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (payload: EventPayload<typeof GatekeeperEvents.WorkspacePlanUpdated>) => {
    const { workspacePlan, previousWorkspacePlan } = payload.payload

    if (isEqual(workspacePlan, previousWorkspacePlan)) return

    const info: WorkspacePlanUpdatedActivity = {
      version: '1.0.0',
      new: {
        name: workspacePlan.name,
        status: workspacePlan.status
      },
      old: {
        ...(previousWorkspacePlan
          ? {
              name: previousWorkspacePlan.name,
              status: previousWorkspacePlan.status
            }
          : {})
      }
    }

    await saveActivity({
      streamId: null,
      resourceType: ResourceTypes.Workspace,
      resourceId: workspacePlan.workspaceId,
      actionType: ActionTypes.Workspace.PlanUpgraded,
      userId: null,
      info,
      message: 'Workspace plan upgraded'
    })
  }

const addWorkspaceSubscriptionUpdatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (
    payload: EventPayload<typeof GatekeeperEvents.WorkspaceSubscriptionUpdated>
  ) => {
    const { workspacePlan, previousWorkspacePlan, subscription, previousSubscription } =
      payload.payload

    if (
      isEqual(workspacePlan, previousWorkspacePlan) &&
      isEqual(subscription, previousSubscription)
    )
      return

    const info: WorkspaceSubscriptionUpdatedActivity = {
      version: '1.0.0',
      new: {
        name: workspacePlan.name,
        status: workspacePlan.status,
        totalEditorSeats: subscription.totalEditorSeats,
        billingInterval: subscription.billingInterval
      },
      old: {
        name: previousWorkspacePlan.name,
        status: previousWorkspacePlan.status,
        totalEditorSeats: previousSubscription.totalEditorSeats,
        billingInterval: previousSubscription.billingInterval
      }
    }

    await saveActivity({
      streamId: null,
      resourceType: ResourceTypes.Workspace,
      resourceId: workspacePlan.workspaceId,
      actionType: ActionTypes.Workspace.SubscriptionUpgraded,
      userId: null,
      info,
      message: 'Workspace subscription upgraded'
    })
  }

export const reportGatekeeperActivityFactory =
  (deps: { eventListen: EventBusListen; saveActivity: SaveActivity }) => () => {
    const addWorkspaceSubscriptionUpdatedActivity =
      addWorkspaceSubscriptionUpdatedActivityFactory(deps)
    const addWorkspacePlanUpdatedActivity = addWorkspacePlanUpdatedActivityFactory(deps)

    const quitters = [
      deps.eventListen(
        GatekeeperEvents.WorkspaceSubscriptionUpdated,
        addWorkspaceSubscriptionUpdatedActivity
      ),
      deps.eventListen(
        GatekeeperEvents.WorkspacePlanUpdated,
        addWorkspacePlanUpdatedActivity
      )
    ]

    return () => quitters.forEach((q) => q())
  }
