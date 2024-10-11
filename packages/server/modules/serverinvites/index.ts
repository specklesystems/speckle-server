import { registerOrUpdateScopeFactory } from '@/modules/shared/repositories/scopes'
import { moduleLogger } from '@/logging/logging'
import db from '@/db/knex'
import { Scopes } from '@speckle/shared'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const scopes = [
  {
    name: Scopes.Users.Invite,
    description: 'Invite others to join this server.',
    public: false
  }
]

export const init: SpeckleModule['init'] = async () => {
  moduleLogger.info('💌 Init invites module')

  const registerFunc = registerOrUpdateScopeFactory({ db })
  for (const scope of scopes) {
    await registerFunc({ scope })
  }
}
