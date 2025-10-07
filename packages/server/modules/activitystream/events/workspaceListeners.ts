import type { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import type {
  GetWorkspaceSummary,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'

const addWorkspaceSeatUpdatedActivityFactory =
  ({
    saveActivity,
    getWorkspaceSummary
  }: {
    saveActivity: SaveActivity
    getWorkspaceSummary: GetWorkspaceSummary
  }) =>
  async ({
    payload: { updatedByUserId, seat, previousSeat }
  }: EventPayload<typeof WorkspaceEvents.SeatUpdated>) => {
    const workspace = await getWorkspaceSummary(seat.workspaceId)

    await saveActivity({
      userId: updatedByUserId,
      contextResourceType: 'workspace',
      eventType: 'workspace_seat_updated',
      contextResourceId: seat.workspaceId,
      payload: {
        version: '1.1' as const,
        workspace,
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
  ({
    saveActivity,
    getWorkspaceSummary
  }: {
    saveActivity: SaveActivity
    getWorkspaceSummary: GetWorkspaceSummary
  }) =>
  async ({
    payload: { updatedByUserId, previousSeat }
  }: EventPayload<typeof WorkspaceEvents.SeatDeleted>) => {
    const workspace = await getWorkspaceSummary(previousSeat.workspaceId)

    await saveActivity({
      userId: updatedByUserId,
      contextResourceType: 'workspace',
      eventType: 'workspace_seat_deleted',
      contextResourceId: previousSeat.workspaceId,
      payload: {
        version: '1.1' as const,
        workspace,
        old: {
          type: previousSeat.type,
          userId: previousSeat.userId
        }
      }
    })
  }

const addWorkspaceDeletedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({ payload }: EventPayload<typeof WorkspaceEvents.Deleted>) => {
    await saveActivity({
      userId: payload.userId,
      contextResourceType: 'workspace',
      eventType: 'workspace_deleted',
      contextResourceId: payload.workspaceId,
      payload: {
        workspace: {
          plan: {
            name: payload.plan.name,
            status: payload.plan.status
          },
          totalEditorSeats: payload.totalEditorSeats,
          totalViewerSeats: payload.totalViewerSeats
        },
        version: '1.1' as const
      }
    })
  }

export const reportWorkspaceActivityFactory =
  (deps: {
    eventListen: EventBusListen
    saveActivity: SaveActivity
    getWorkspaceSummary: GetWorkspaceSummary
  }) =>
  () => {
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
