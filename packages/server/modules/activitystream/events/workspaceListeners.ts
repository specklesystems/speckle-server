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

export const reportWorkspaceActivityFactory =
  (deps: { eventListen: EventBusListen; saveActivity: SaveActivity }) => () => {
    const addWorkspaceSeatUpdatedActivity = addWorkspaceSeatUpdatedActivityFactory(deps)
    const addWorkspaceSeatDeletedActivity = addWorkspaceSeatDeletedActivityFactory(deps)

    const quitters = [
      deps.eventListen(WorkspaceEvents.SeatUpdated, addWorkspaceSeatUpdatedActivity),
      deps.eventListen(WorkspaceEvents.SeatDeleted, addWorkspaceSeatDeletedActivity)
    ]

    return () => quitters.forEach((q) => q())
  }
