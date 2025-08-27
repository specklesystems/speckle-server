import { db } from '@/db/knex'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { storeProjectRoleFactory } from '@/modules/core/repositories/projects'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  createStreamFactory,
  getStreamFactory,
  getStreamRolesFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import {
  countAdminUsersFactory,
  getUserFactory,
  getUsersFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { createTokenFactory } from '@/modules/core/services/tokens'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { createUserFactory } from '@/modules/core/services/users/management'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { expireOldPendingUploadsFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { notifyChangeInFileStatus } from '@/modules/fileuploads/services/management'
import { manageFileImportExpiryFactory } from '@/modules/fileuploads/services/tasks'
import {
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { authorizeResolver } from '@/modules/shared'
import { getEventBus } from '@/modules/shared/services/eventBus'

export const initUploadTestEnvironment = () => {
  const getServerInfo = getServerInfoFactory({ db })
  const getUser = getUserFactory({ db })
  const getUsers = getUsersFactory({ db })
  const getStream = getStreamFactory({ db })
  const findEmail = findEmailFactory({ db })
  const requestNewEmailVerification = requestNewEmailVerificationFactory({
    findEmail,
    getUser: getUserFactory({ db }),
    getServerInfo,
    deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
    renderEmail,
    sendEmail
  })

  const createUser = createUserFactory({
    getServerInfo,
    findEmail,
    storeUser: storeUserFactory({ db }),
    countAdminUsers: countAdminUsersFactory({ db }),
    storeUserAcl: storeUserAclFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail,
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification
    }),
    emitEvent: getEventBus().emit
  })

  const createToken = createTokenFactory({
    storeApiToken: storeApiTokenFactory({ db }),
    storeTokenScopes: storeTokenScopesFactory({ db }),
    storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
      db
    })
  })

  const garbageCollector = manageFileImportExpiryFactory({
    garbageCollectExpiredPendingUploads: expireOldPendingUploadsFactory({
      db
    }),
    notifyUploadStatus: notifyChangeInFileStatus({
      eventEmit: getEventBus().emit
    })
  })

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

  const createBranch = createBranchFactory({ db })
  const createStream = legacyCreateStreamFactory({
    createStreamReturnRecord: createStreamReturnRecordFactory({
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
      createBranch,
      storeProjectRole: storeProjectRoleFactory({ db }),
      emitEvent: getEventBus().emit
    })
  })

  return {
    findEmail,
    requestNewEmailVerification,
    createUser,
    createToken,
    createStream,
    getUser,
    getUsers,
    getStream,
    garbageCollector,
    buildFinalizeProjectInvite,
    createBranch
  }
}
