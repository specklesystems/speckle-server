import { UserSignUpContext } from '@/modules/core/domain/users/types'
import { UserRecord } from '@/modules/core/helpers/types'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'
import { Optional } from '@speckle/shared'

export enum UsersEvents {
  Created = 'created'
}

export type UsersEventsPayloads = {
  [UsersEvents.Created]: {
    user: UserRecord
    /**
     * Should be set in all real non-simulated sign up sessions
     */
    signUpCtx: Optional<UserSignUpContext>
  }
}

const { emit, listen } = initializeModuleEventEmitter<UsersEventsPayloads>({
  moduleName: 'core',
  namespace: 'users'
})

export const UsersEmitter = { emit, listen, events: UsersEvents }
export type UsersEventsEmitter = (typeof UsersEmitter)['emit']
export type UsersEventsListener = (typeof UsersEmitter)['listen']
