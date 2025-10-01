import type { User, UserSignUpContext } from '@/modules/core/domain/users/types'
import type { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import type { WorkspaceSeat } from '@/modules/workspacesCore/domain/types'
import type { Optional } from '@speckle/shared'

export const userEventsNamespace = 'users' as const

export const UserEvents = {
  Created: `${userEventsNamespace}.created`,
  Deleted: `${userEventsNamespace}.deleted`,
  Updated: `${userEventsNamespace}.updated`,
  Authenticated: `${userEventsNamespace}.authenticated`
} as const

export type UserEventsPayloads = {
  [UserEvents.Created]: {
    user: User
    /**
     * Should be set in all real non-simulated sign up sessions
     */
    signUpCtx: Optional<UserSignUpContext>
  }
  [UserEvents.Deleted]: {
    targetUserId: string
    invokerUserId: string
    deletedSeats: WorkspaceSeat[]
  }
  [UserEvents.Updated]: {
    oldUser: User
    update: UserUpdateInput
    updaterId: string
  }
  [UserEvents.Authenticated]: {
    userId: string
    /**
     * Whether the user just registered or not
     */
    isNewUser: boolean
  }
}
