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
import { storeObjectsIfNotFoundFactory } from '@/modules/core/repositories/objects'
import { expect } from 'chai'
import { parse, Parser } from 'csv-parse'
import { createReadStream } from 'fs'
import { createObjectsBatchedAndNoClosuresFactory } from '@/modules/core/services/objects/management'

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
const createObjectsBatched = createObjectsBatchedAndNoClosuresFactory({
  storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({ db })
})

describe('Objects streaming REST @core', () => {
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
    for (let i = 0; i < 4; i++) {
      await forceCloseStreamingConnection({
        serverAddress,
        projectId: project.id,
        token,
        objsIds
      })
    }

    //sleep for a bit to allow the server to close the connections
    await new Promise((r) => setTimeout(r, 3000))
    const gaugeContents = await determineRemainingDatabaseConnectionCapacity({
      serverAddress
    })
    expect(parseInt(gaugeContents), gaugeContents).to.gte(4) //expect all connections to become available again after the client closes them
  })

  it('should stream model with some failing feature', async () => {
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

    // import CSV file
    const csvStream = createReadStream(
      //FIXME this relies on running this test from `packages/server` directory
      `${process.cwd()}/test/assets/failing-streaming-model-f547dc4e88.csv`
    )
      // eslint-disable-next-line camelcase
      .pipe(parse({ delimiter: ',', from_line: 2 }))

    function csvParserAsPromise(
      stream: Parser
    ): Promise<{ manyObjs: RawSpeckleObject[]; objsIds: string[] }> {
      const manyObjs: RawSpeckleObject[] = []
      const objsIds: string[] = []
      return new Promise((resolve, reject) => {
        stream.on('data', (row: string[]) => {
          const obj = JSON.parse(row[1])
          manyObjs.push(obj)
          objsIds.push(row[0])
        })
        stream.on('end', () => resolve({ manyObjs, objsIds }))
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        stream.on('error', (error: unknown) => reject(error))
      })
    }

    const { manyObjs, objsIds } = await csvParserAsPromise(csvStream)

    const preGaugeContents = await determineRemainingDatabaseConnectionCapacity({
      serverAddress
    })
    expect(
      parseInt(preGaugeContents),
      `Prior to test, we did not have sufficient DB connections free: ${preGaugeContents}`
    ).to.gte(4) // all connections are available before the test

    await createObjectsBatched({ streamId: project.id, objects: manyObjs })
    for (let i = 0; i < 1; i++) {
      await forceCloseStreamingConnection({
        serverAddress,
        projectId: project.id,
        token,
        objsIds
      })
    }

    //sleep for a bit to allow the server to close the connections
    await new Promise((r) => setTimeout(r, 3000))
    const postGaugeContents = await determineRemainingDatabaseConnectionCapacity({
      serverAddress
    })
    expect(
      parseInt(postGaugeContents),
      `After the test, we did not have sufficient DB connections free: ${postGaugeContents}`
    ).to.gte(4) //expect all connections to become available again after the client closes them
  }).timeout(50000)
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

const determineRemainingDatabaseConnectionCapacity = async (params: {
  serverAddress: string
}): Promise<string> => {
  const { serverAddress } = params
  const metricsResponse = await fetch(`${serverAddress}/metrics`, {
    method: 'GET'
  })
  const metricBody = await metricsResponse.text()
  const match = [
    ...metricBody.matchAll(/(^speckle_server_knex_remaining_capacity.*)\}\s([\d]+)$/gm)
  ]
  if (!match) {
    expect(match).not.to.be.null
    return '' //HACK force correct type below
  }
  const gaugeContents = match[0][2] //second capture group of the first & only match gives the gauge value
  if (!gaugeContents) {
    expect(gaugeContents).not.to.be.null
    return '' //HACK force correct type below
  }
  return gaugeContents
}
