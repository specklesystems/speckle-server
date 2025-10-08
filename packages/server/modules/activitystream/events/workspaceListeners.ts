import type { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import type { SaveActivity } from '@/modules/activitystream/domain/operations'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'

const addWorkspaceSeatUpdatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: { updatedByUserId, seat, previousSeat }
  }: EventPayload<typeof WorkspaceEvents.SeatUpdated>) => {
    await saveActivity({
      userId: updatedByUserId,
      contextResourceType: 'workspace',
      eventType: 'workspace_seat_updated',
      contextResourceId: seat.workspaceId,
      payload: {
        version: '1' as const,
        new: {
          type: seat.type,
          userId: seat.userId
        },
        old: previousSeat
          ? {
              type: previousSeat.type,
              userId: previousSeat.userId
            }
          : null
      }
    })
  }

const addWorkspaceSeatDeletedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: { updatedByUserId, previousSeat }
  }: EventPayload<typeof WorkspaceEvents.SeatDeleted>) => {
    await saveActivity({
      userId: updatedByUserId,
      contextResourceType: 'workspace',
      eventType: 'workspace_seat_deleted',
      contextResourceId: previousSeat.workspaceId,
      payload: {
        version: '1' as const,
        old: {
          type: previousSeat.type,
          userId: previousSeat.userId
        }
      }
    })
  }

const addWorkspaceDeletedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: { userId, workspaceId }
  }: EventPayload<typeof WorkspaceEvents.Deleted>) => {
    await saveActivity({
      userId,
      contextResourceType: 'workspace',
      eventType: 'workspace_deleted',
      contextResourceId: workspaceId,
      payload: {
        version: '1' as const
      }
    })
  }

export const reportWorkspaceActivityFactory =
  (deps: { eventListen: EventBusListen; saveActivity: SaveActivity }) => () => {
    const addWorkspaceSeatUpdatedActivity = addWorkspaceSeatUpdatedActivityFactory(deps)
    const addWorkspaceSeatDeletedActivity = addWorkspaceSeatDeletedActivityFactory(deps)
    const addWorkspaceDeletedActivity = addWorkspaceDeletedActivityFactory(deps)

    const quitters = [
      deps.eventListen(WorkspaceEvents.SeatUpdated, addWorkspaceSeatUpdatedActivity),
      deps.eventListen(WorkspaceEvents.SeatDeleted, addWorkspaceSeatDeletedActivity),
      deps.eventListen(WorkspaceEvents.Deleted, addWorkspaceDeletedActivity)
    ]

    return () => quitters.forEach((q) => q())
  }
