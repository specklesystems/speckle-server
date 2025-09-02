import { createStreamReturnRecordFactory } from '@/modules/core/services/streams/management'
import {
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { db } from '@/db/knex'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  createStreamFactory,
  getStreamFactory,
  getStreamRolesFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { grantProjectPermissionsFactory } from '@/modules/core/repositories/streams'
import { storeProjectRoleFactory } from '@/modules/core/repositories/projects'

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })
const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser,
        grantStreamPermissions: grantStreamPermissionsFactory({ db }),
        getStreamRoles: getStreamRolesFactory({ db }),
        emitEvent: getEventBus().emit
      })
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: (...args) => getEventBus().emit(...args),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db }),
        getUser,
        getServerInfo,
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    getUser,
    getServerInfo
  })

export const createProject = createStreamReturnRecordFactory({
  inviteUsersToProject: inviteUsersToProjectFactory({
    createAndSendInvite: createAndSendInviteFactory({
      findUserByTarget: findUserByTargetFactory({ db }),
      insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
      collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
        getStream
      }),
      buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
        getStream
      }),
      emitEvent: ({ eventName, payload }) =>
        getEventBus().emit({
          eventName,
          payload
        }),
      getUser,
      getServerInfo,
      finalizeInvite: buildFinalizeProjectInvite()
    }),
    getUsers
  }),
  createStream: createStreamFactory({ db }),
  createBranch: createBranchFactory({ db }),
  storeProjectRole: storeProjectRoleFactory({ db }),
  emitEvent: getEventBus().emit
})

export const grantProjectPermissions = grantProjectPermissionsFactory({ db })
