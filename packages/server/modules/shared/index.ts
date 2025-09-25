import { db } from '@/db/knex'
import { getStreamFactory } from '@/modules/core/repositories/streams'
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
  StreamSubscriptions,
  CommitSubscriptions,
  BranchSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { getWorkspaceRoleAndSeatFactory } from '@/modules/workspacesCore/repositories/rolesSeats'

export {
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
