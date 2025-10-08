import type { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import { GatekeeperEvents } from '@/modules/gatekeeperCore/domain/events'
import type { SaveActivity } from '@/modules/activitystream/domain/operations'

const addWorkspacePlanCreatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: { userId, workspacePlan }
  }: EventPayload<typeof GatekeeperEvents.WorkspacePlanCreated>) => {
    await saveActivity({
      userId,
      contextResourceType: 'workspace',
      eventType: 'workspace_plan_created',
      contextResourceId: workspacePlan.workspaceId,
      payload: {
        version: '1' as const,
        new: {
          name: workspacePlan.name,
          status: workspacePlan.status
        }
      }
    })
  }

const addWorkspacePlanUpdatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: { userId, workspacePlan, previousWorkspacePlan }
  }: EventPayload<typeof GatekeeperEvents.WorkspacePlanUpdated>) => {
    await saveActivity({
      userId,
      contextResourceType: 'workspace',
      eventType: 'workspace_plan_updated',
      contextResourceId: workspacePlan.workspaceId,
      payload: {
        version: '1' as const,
        new: {
          name: workspacePlan.name,
          status: workspacePlan.status
        },
        old: {
          name: previousWorkspacePlan.name,
          status: previousWorkspacePlan.status
        }
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
    await saveActivity({
      userId,
      contextResourceType: 'workspace',
      contextResourceId: workspacePlan.workspaceId,
      eventType: 'workspace_subscription_updated',
      payload: {
        version: '1' as const,
        new: {
          name: workspacePlan.name,
          status: workspacePlan.status,
          ...subscription
        },
        old: {
          name: previousWorkspacePlan.name,
          status: previousWorkspacePlan.status,
          ...(previousSubscription || {})
        }
      }
    })
  }

export const reportGatekeeperActivityFactory =
  (deps: { eventListen: EventBusListen; saveActivity: SaveActivity }) => () => {
    const addWorkspaceSubscriptionUpdatedActivity =
      addWorkspaceSubscriptionUpdatedActivityFactory(deps)
    const addWorkspacePlanUpdatedActivity = addWorkspacePlanUpdatedActivityFactory(deps)
    const addWorkspacePlanCreatedActivity = addWorkspacePlanCreatedActivityFactory(deps)

    const quitters = [
      deps.eventListen(
        GatekeeperEvents.WorkspaceSubscriptionUpdated,
        addWorkspaceSubscriptionUpdatedActivity
      ),
      deps.eventListen(
        GatekeeperEvents.WorkspacePlanUpdated,
        addWorkspacePlanUpdatedActivity
      ),
      deps.eventListen(
        GatekeeperEvents.WorkspacePlanCreated,
        addWorkspacePlanCreatedActivity
      )
    ]

    return () => quitters.forEach((q) => q())
  }
