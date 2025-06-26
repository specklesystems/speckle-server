import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'
import { isEqual } from 'lodash'
import { SaveActivity } from '@/modules/activitystream/domain/operations'

const addWorkspacePlanUpdatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: { userId, workspacePlan, previousWorkspacePlan }
  }: EventPayload<typeof GatekeeperEvents.WorkspacePlanUpdated>) => {
    if (isEqual(workspacePlan, previousWorkspacePlan)) return

    await saveActivity({
      userId,
      contextResourceType: 'workspace',
      eventType: 'workspace_plan_upgraded',
      contextResourceId: workspacePlan.workspaceId,
      payload: {
        version: '1' as const,
        new: {
          name: workspacePlan.name,
          status: workspacePlan.status
        },
        old: previousWorkspacePlan
          ? {
              name: previousWorkspacePlan.name,
              status: previousWorkspacePlan.status
            }
          : null
      }
    })
  }

const addWorkspaceSubscriptionUpdatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: {
      userId,
      workspacePlan,
      previousWorkspacePlan,
      subscription,
      previousSubscription
    }
  }: EventPayload<typeof GatekeeperEvents.WorkspaceSubscriptionUpdated>) => {
    if (
      isEqual(workspacePlan, previousWorkspacePlan) &&
      isEqual(subscription, previousSubscription)
    )
      return

    await saveActivity({
      userId,
      contextResourceType: 'workspace',
      contextResourceId: workspacePlan.workspaceId,
      eventType: 'workspace_subscription_upgraded',
      payload: {
        version: '1' as const,
        new: {
          name: workspacePlan.name,
          status: workspacePlan.status,
          billingInterval: subscription.billingInterval,
          totalEditorSeats: subscription.totalEditorSeats
        },
        old: {
          name: previousWorkspacePlan.name,
          status: previousWorkspacePlan.status,
          billingInterval: previousSubscription.billingInterval,
          totalEditorSeats: previousSubscription.totalEditorSeats
        }
      }
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
