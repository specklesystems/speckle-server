/* istanbul ignore file */
import { expect } from 'chai'

import { beforeEachContext } from '@/test/hooks'

import { validateScopes, authorizeResolver } from '@/modules/shared'
import { buildContext } from '@/modules/shared/middleware'
import { AvailableRoles, Roles, Scopes, ServerRoles } from '@speckle/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import { ForbiddenError } from '@/modules/shared/errors'
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
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory,
  findInviteFactory,
  deleteInvitesByTargetFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} from '@/modules/core/repositories/users'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { mockAdminOverride } from '@/test/mocks/global'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { Request } from 'express'

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

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })
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
    createBranch: createBranchFactory({ db }),
    emitEvent: getEventBus().emit
  })
})

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
const adminOverrideMock = mockAdminOverride()

describe('Generic AuthN & AuthZ controller tests', () => {
  before(async () => {
    await beforeEachContext()
  })

  it('Validate scopes', async () => {
    await validateScopes(undefined, undefined as unknown as string)
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('Your auth token does not have the required scope.').to.equal(
          err.message
        )
      )

    await validateScopes(['a'], 'b')
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('Your auth token does not have the required scope: b.').to.equal(
          err.message
        )
      )

    await validateScopes(['a', 'b'], 'b') // should pass
  })
  ;(<const>[
    ['BS header', { req: { headers: { authorization: 'Bearer BS' } } as Request }],
    [
      'Null header',
      { req: { headers: { authorization: null as string | null } } as Request }
    ],
    ['Undefined header', { req: { headers: { authorization: undefined } } as Request }],
    ['BS token', { token: 'Bearer BS' }],
    ['Null token', { token: null }],
    ['Undefined token', { token: undefined }]
  ]).map(([caseName, contextInput]) =>
    it(`Should create proper context ${caseName}`, async () => {
      const res = await buildContext(contextInput)
      expect(res.auth).to.equal(false)
    })
  )

  it('Should validate server role', async () => {
    await throwForNotHavingServerRole(
      { auth: true, role: Roles.Server.User },
      Roles.Server.Admin
    )
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('You do not have the required server role').to.equal(err.message)
      )

    await throwForNotHavingServerRole(
      { auth: true, role: 'HACZOR' as ServerRoles },
      '133TCR3w' as ServerRoles
    )
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('Invalid role requirement specified').to.equal(err.message)
      )

    await throwForNotHavingServerRole(
      { auth: true, role: Roles.Server.Admin },
      '133TCR3w' as ServerRoles
    )
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) =>
        expect('Invalid role requirement specified').to.equal(err.message)
      )

    const test = await throwForNotHavingServerRole(
      { auth: true, role: Roles.Server.Admin },
      Roles.Server.User
    )
    expect(test).to.equal(true)
  })

  it('Resolver Authorization Should fail nicely when roles & resources are wanky', async () => {
    await authorizeResolver(null, 'foo', 'bar' as AvailableRoles, null)
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) => expect('Unknown role: bar').to.equal(err.message))

    // this caught me out, but streams:read is not a valid role for now
    await authorizeResolver(
      'foo',
      'bar' as AvailableRoles,
      Scopes.Streams.Read as AvailableRoles,
      null
    )
      .then(() => {
        throw new Error('This should have been rejected')
      })
      .catch((err) => expect('Unknown role: streams:read').to.equal(err.message))
  })

  describe('Authorize resolver ', () => {
    const myStream = {
      name: 'My Stream 2',
      isPublic: true,
      id: ''
    }
    const notMyStream = {
      name: 'Not My Stream 1',
      isPublic: false,
      id: ''
    }
    const serverOwner = {
      name: 'Itsa Me',
      email: 'me@example.org',
      password: 'sn3aky-1337-b1m',
      id: ''
    }
    const otherGuy = {
      name: 'Some Other DUde',
      email: 'otherguy@example.org',
      password: 'sn3aky-1337-b1m',
      id: ''
    }

    before(async function () {
      // Seeding
      serverOwner.id = await createUser(serverOwner)
      otherGuy.id = await createUser(otherGuy)

      await Promise.all([
        createStream({ ...myStream, ownerId: serverOwner.id }).then(
          (id) => (myStream.id = id)
        ),
        createStream({ ...notMyStream, ownerId: otherGuy.id }).then(
          (id) => (notMyStream.id = id)
        )
      ])
    })

    afterEach(() => {
      adminOverrideMock.disable()
    })
    after(() => {
      adminOverrideMock.disable()
    })
    it('should allow stream:owners to be stream:owners', async () => {
      await authorizeResolver(
        serverOwner.id,
        myStream.id,
        Roles.Stream.Contributor,
        null
      )
    })

    it('should get the passed in role for server:admins if override enabled', async () => {
      adminOverrideMock.enable(true)
      await authorizeResolver(
        serverOwner.id,
        myStream.id,
        Roles.Stream.Contributor,
        null
      )
    })
    it('should not allow server:admins to be anything if adminOverride is disabled', async () => {
      try {
        await authorizeResolver(
          serverOwner.id,
          notMyStream.id,
          Roles.Stream.Contributor,
          null
        )
        throw new Error('This should have thrown')
      } catch (e) {
        expect(e instanceof ForbiddenError)
      }
    })

    it('should allow server:admins to be anything if adminOverride is enabled', async () => {
      adminOverrideMock.enable(true)

      await authorizeResolver(
        serverOwner.id,
        notMyStream.id,
        Roles.Stream.Contributor,
        null
      )
    })

    it('should not allow server:users to be anything if adminOverride is disabled', async () => {
      try {
        await authorizeResolver(
          otherGuy.id,
          myStream.id,
          Roles.Stream.Contributor,
          null
        )
        throw new Error('This should have thrown')
      } catch (e) {
        expect(e instanceof ForbiddenError)
      }
    })

    it('should not allow server:users to be anything if adminOverride is enabled', async () => {
      adminOverrideMock.enable(true)

      try {
        await authorizeResolver(
          otherGuy.id,
          myStream.id,
          Roles.Stream.Contributor,
          null
        )
        throw new Error('This should have thrown')
      } catch (e) {
        expect(e instanceof ForbiddenError)
      }
    })
  })
})
