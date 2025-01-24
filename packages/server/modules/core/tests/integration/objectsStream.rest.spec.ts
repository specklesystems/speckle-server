/**
 * Tests for regression of issue where closing client connections prematurely caused the database connection never to be closed (zombie)
 */
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import {
  countAdminUsersFactory,
  legacyGetUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { createUserFactory } from '@/modules/core/services/users/management'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storePersonalApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import { Scopes } from '@speckle/shared'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { generateManyObjects } from '@/test/helpers'
import { RawSpeckleObject } from '@/modules/core/domain/objects/types'
import { createObjectsBatchedFactory } from '@/modules/core/services/objects/management'
import {
  storeClosuresIfNotFoundFactory,
  storeObjectsIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import { expect } from 'chai'

const getServerInfo = getServerInfoFactory({ db })
const getUser = legacyGetUserFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail: findEmailFactory({ db }),
  getUser,
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})

const createUserEmail = validateAndCreateUserEmailFactory({
  createUserEmail: createUserEmailFactory({ db }),
  ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
  findEmail: findEmailFactory({ db }),
  updateEmailInvites: finalizeInvitedServerRegistrationFactory({
    deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
    updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
  }),
  requestNewEmailVerification
})

const findEmail = findEmailFactory({ db })
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: createUserEmail,
  emitEvent: getEventBus().emit
})

const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})
const createObjectsBatched = createObjectsBatchedFactory({
  storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({ db }),
  storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
})

describe('Objects REST @core', () => {
  let serverAddress: string
  before(async () => {
    const ctx = await beforeEachContext()
    ;({ serverAddress } = await initializeTestServer(ctx))
  })
  it('should close database connections if client connection is prematurely closed', async () => {
    const userId = await createUser({
      name: 'emails user',
      email: createRandomEmail(),
      password: createRandomPassword()
    })
    const user = await getUser(userId)

    const project = {
      id: '',
      name: 'test project',
      ownerId: userId
    }
    await createTestStream(project as unknown as BasicTestStream, user)

    const token = `Bearer ${await createPersonalAccessToken(
      user.id,
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

    const manyObjs: { commit: RawSpeckleObject; objs: RawSpeckleObject[] } =
      generateManyObjects(3333, 'perlin merlin magic')
    const objsIds = manyObjs.objs.map((o) => o.id)

    await createObjectsBatched({ streamId: project.id, objects: manyObjs.objs })
    for (let i = 0; i < 40; i++) {
      forceCloseStreamingConnection({
        serverAddress,
        projectId: project.id,
        token,
        objsIds
      })
    }

    //sleep for a bit to allow the server to close the connections
    await new Promise((r) => setTimeout(r, 3000))

    const metricsResponse = await fetch(`${serverAddress}/metrics`, {
      method: 'GET'
    })
    const metricBody = await metricsResponse.text()
    const match = [
      ...metricBody.matchAll(
        /(^speckle_server_knex_remaining_capacity.*)\}\s([\d]+)$/gm
      )
    ]
    if (!match) {
      expect(match).not.to.be.null
      return //HACK force correct type below
    }
    const gaugeContents = match[0][2] //second capture group of the first & only match gives the gauge value
    expect(parseInt(gaugeContents), gaugeContents).to.lte(3)
  })
})

const forceCloseStreamingConnection = async (params: {
  serverAddress: string
  projectId: string
  token: string
  objsIds: (string | undefined)[]
}) => {
  const { serverAddress, projectId, token, objsIds } = params
  const controller = new AbortController()
  const signal = controller.signal

  const stream = await fetch(`${serverAddress}/api/getobjects/${projectId}`, {
    signal,
    method: 'POST',
    headers: {
      Authorization: token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      objects: JSON.stringify(objsIds)
    })
  })

  const partiallyGetBodyStreamThenCloseConnection = async () => {
    const reader = stream.body?.getReader({ mode: 'byob' })
    const buffer = new ArrayBuffer(1) //tiny buffer of 1 byte
    await reader?.read(new Uint8Array(buffer, 0, buffer.byteLength)) // read first byte into our tiny buffer
    controller.abort('force closing the connection') //immediately abort the connection
  }
  await partiallyGetBodyStreamThenCloseConnection()
}
