// eslint-disable-next-line no-restricted-imports
import '../bootstrap'
import { createManyObjects } from '@/test/helpers'
import { fetch } from 'undici'
import { init } from '@/app'
import request from 'supertest'
import { logger } from '@/observability/logging'
import { Scopes } from '@speckle/shared'
import {
  getStreamFactory,
  createStreamFactory,
  grantStreamPermissionsFactory,
  getStreamRolesFactory
} from '@/modules/core/repositories/streams'
import { db } from '@/db/knex'
import {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import {
  getUsersFactory,
  getUserFactory,
  legacyGetUserByEmailFactory
} from '@/modules/core/repositories/users'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storePersonalApiTokenFactory
} from '@/modules/core/repositories/tokens'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
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
import { storeProjectRoleFactory } from '@/modules/core/repositories/projects'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const getUser = getUserFactory({ db })
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

// This does not support multiregion
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
    storeProjectRole: storeProjectRoleFactory({ db }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    emitEvent: getEventBus().emit
  })
})
const getUserByEmail = legacyGetUserByEmailFactory({ db })
const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})

const main = async () => {
  const testStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream',
    id: ''
  }

  // const userA = {
  //   name: 'd1',
  //   email: 'd.1@speckle.systems',
  //   password: 'wowwow8charsplease'
  // }
  // userA.id = await createUser(userA)

  const userA = {
    ...(await getUserByEmail({
      email: 'd.1@speckle.systems'
    }))!,
    token: ''
  }

  userA.token = `Bearer ${await createPersonalAccessToken(
    userA.id,
    'test token user A',
    [
      Scopes.Streams.Read,
      Scopes.Streams.Write,
      Scopes.Users.Read,
      Scopes.Users.Email,
      Scopes.Tokens.Write,
      Scopes.Tokens.Read,
      Scopes.Profile.Read,
      Scopes.Profile.Email
    ]
  )}`

  testStream.id = await createStream({ ...testStream, ownerId: userA.id })

  const { app } = await init()

  const numObjs = 5000
  const objBatch = createManyObjects(numObjs)

  const uploadRes = await request(app)
    .post(`/objects/${testStream.id}`)
    .set('Authorization', userA.token)
    .set('Content-type', 'multipart/form-data')
    .attach('batch1', Buffer.from(JSON.stringify(objBatch), 'utf8'))

  logger.info(uploadRes.status)
  const objectIds = objBatch.map((obj) => obj.id)

  const res = await fetch(`http://127.0.0.1:3000/api/getobjects/${testStream.id}`, {
    method: 'POST',
    headers: {
      Authorization: userA.token,
      'Content-Type': 'application/json',
      Accept: 'text/plain'
    },
    body: JSON.stringify({ objects: JSON.stringify(objectIds) })
  })
  const data = await res.body!.getReader().read()
  logger.info(data)
  process.exit(0)
}

main()
  .then(() => logger.info('created'))
  .catch((err) => logger.error('failed', err))
