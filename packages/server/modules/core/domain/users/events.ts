import { User, UserSignUpContext } from '@/modules/core/domain/users/types'
import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import { Optional } from '@speckle/shared'

export const userEventsNamespace = 'users' as const

export const UserEvents = {
  Created: `${userEventsNamespace}.created`,
  Deleted: `${userEventsNamespace}.deleted`,
  Updated: `${userEventsNamespace}.updated`
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
  }
  [UserEvents.Updated]: {
    oldUser: User
    update: UserUpdateInput
    updaterId: string
  }
}
