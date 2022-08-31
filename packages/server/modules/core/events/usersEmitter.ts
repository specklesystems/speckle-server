import { UserRecord } from '@/modules/core/helpers/types'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export enum UsersEvents {
  Created = 'created'
}

const { emit, listen } = initializeModuleEventEmitter<{
  [UsersEvents.Created]: { user: UserRecord }
}>({
  moduleName: 'core',
  namespace: 'users'
})

export const UsersEmitter = { emit, listen, events: UsersEvents }
