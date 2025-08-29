import { db } from '@/db/knex'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
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
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { createTokenFactory } from '@/modules/core/services/tokens'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
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
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
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

  return {
    findEmail,
    requestNewEmailVerification,
    createToken,
    getUser,
    getUsers,
    getStream,
    garbageCollector,
    buildFinalizeProjectInvite,
    createBranch
  }
}
