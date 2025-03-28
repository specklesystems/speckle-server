import { SeatTypes } from '../../core/constants.js'
import { throwUncoveredError } from '../../core/index.js'
import { AuthPolicyCheck, UserContext, WorkspaceContext } from '../domain/policies.js'

export const hasEditorSeat: AuthPolicyCheck<
  'getWorkspaceSeat',
  UserContext & WorkspaceContext
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    const seat = await loaders.getWorkspaceSeat({
      userId,
      workspaceId
    })
    if (seat.isErr) {
      switch (seat.error.code) {
        case 'WorkspaceSeatNotFound':
          return false
        default:
          throwUncoveredError(seat.error.code)
      }
    }
    return seat.value === SeatTypes.Editor
  }
