import { User, UserSignUpContext } from '@/modules/core/domain/users/types'
import { Optional } from '@speckle/shared'

export const userEventsNamespace = 'users' as const

export const UserEvents = {
  Created: `${userEventsNamespace}.created`
} as const

export type UserEventsPayloads = {
  [UserEvents.Created]: {
    user: User
    /**
     * Should be set in all real non-simulated sign up sessions
     */
    signUpCtx: Optional<UserSignUpContext>
  }
}
