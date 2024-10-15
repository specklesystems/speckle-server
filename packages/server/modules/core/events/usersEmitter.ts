import { UserRecord } from '@/modules/core/helpers/types'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export enum UsersEvents {
  Created = 'created'
}

export type UsersEventsPayloads = {
  [UsersEvents.Created]: { user: UserRecord }
}

const { emit, listen } = initializeModuleEventEmitter<UsersEventsPayloads>({
  moduleName: 'core',
  namespace: 'users'
})

export const UsersEmitter = { emit, listen, events: UsersEvents }
export type UsersEventsEmitter = (typeof UsersEmitter)['emit']
export type UsersEventsListener = (typeof UsersEmitter)['listen']
