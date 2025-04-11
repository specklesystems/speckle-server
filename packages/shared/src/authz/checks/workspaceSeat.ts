import { SeatTypes } from '../../core/constants.js'
import { UserContext, WorkspaceContext } from '../domain/context.js'
import { AuthPolicyCheck } from '../domain/policies.js'

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
    if (!seat) return false
    return seat === SeatTypes.Editor
  }
