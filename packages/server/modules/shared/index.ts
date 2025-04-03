import { db } from '@/db/knex'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getWorkspaceRoleAndSeatFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import { adminOverrideEnabled } from '@/modules/shared/helpers/envHelper'
import {
  getUserAclRoleFactory,
  getUserServerRoleFactory
} from '@/modules/shared/repositories/acl'
import { getCachedRolesFactory } from '@/modules/shared/repositories/roles'
import {
  authorizeResolverFactory,
  validateScopesFactory
} from '@/modules/shared/services/auth'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  pubsub,
  StreamSubscriptions,
  CommitSubscriptions,
  BranchSubscriptions
} from '@/modules/shared/utils/subscriptions'

export {
  pubsub,
  StreamSubscriptions as StreamPubsubEvents,
  CommitSubscriptions as CommitPubsubEvents,
  BranchSubscriptions as BranchPubsubEvents
}

export const validateScopes = validateScopesFactory()
export const authorizeResolver = authorizeResolverFactory({
  getRoles: getCachedRolesFactory({ db }),
  adminOverrideEnabled,
  getUserServerRole: getUserServerRoleFactory({ db }),
  getStream: getStreamFactory({ db }),
  getUserAclRole: getUserAclRoleFactory({ db }),
  emitWorkspaceEvent: getEventBus().emit,
  getWorkspaceRoleAndSeat: getWorkspaceRoleAndSeatFactory({ db })
})
