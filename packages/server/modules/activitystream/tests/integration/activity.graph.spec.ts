/* istanbul ignore file */
import { expect } from 'chai'

import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { noErrors } from '@/test/helpers'

import { Roles, Scopes } from '@speckle/shared'
import { getUserActivityFactory } from '@/modules/activitystream/repositories'
import { db } from '@/db/knex'
import {
  validateStreamAccessFactory,
  addOrUpdateStreamCollaboratorFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import {
  getStreamRolesFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import {
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
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storePersonalApiTokenFactory,
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory
} from '@/modules/core/repositories/tokens'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import { storeSingleObjectIfNotFoundFactory } from '@/modules/core/repositories/objects'
import { getEventBus } from '@/modules/shared/services/eventBus'
import type http from 'node:http'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { BasicTestBranch, createTestBranch } from '@/test/speckle-helpers/branchHelper'
import { getActivitiesFactory } from '@/modules/activitystream/repositories/index'

const getUser = getUserFactory({ db })
const getUserActivity = getUserActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})

const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo: getServerInfoFactory({ db }),
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})
const createUser = createUserFactory({
  getServerInfo: getServerInfoFactory({ db }),
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

const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})
const createObject = createObjectFactory({
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db })
})

const getActivities = getActivitiesFactory({ db })

let server: http.Server
let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

describe('Activity @activity', () => {
  const userIz = {
    name: 'Izzy Lyseggen',
    email: 'izzybizzi@speckle.systems',
    password: 'sp0ckle sucks 9001',
    id: '',
    token: ''
  }

  const userCr = {
    name: 'Cristi Balas',
    email: 'cristib@speckle.systems',
    password: 'hack3r man 666',
    id: '',
    token: ''
  }

  const userX = {
    name: 'Mystery User',
    email: 'mysteriousDude@speckle.systems',
    password: 'super $ecret pw0rd',
    id: '',
    token: ''
  }

  const streamPublic: BasicTestStream = {
    name: 'a fun stream for sharing',
    description: 'for all to see!',
    isPublic: true,
    id: '',
    ownerId: ''
  }

  // const collaboratorTestStream = {
  //   name: 'a fun stream for testing collab stuff',
  //   description: 'for all to see!',
  //   isPublic: true,
  //   id: undefined
  // }

  const branchPublic: BasicTestBranch = {
    name: '🍁maple branch',
    id: '',
    streamId: '',
    authorId: ''
  }

  const streamSecret: BasicTestStream = {
    name: 'a secret stream for me',
    description: 'for no one to see!',
    isPublic: false,
    id: '',
    ownerId: ''
  }

  const testObj = {
    hello: 'hallo',
    cool: 'kult',
    bunny: 'kanin',
    id: ''
  }
  const testObj2 = {
    goodbye: 'ha det bra',
    warm: 'varmt',
    bunny: 'kanin',
    id: ''
  }

  before(async () => {
    const ctx = await beforeEachContext()
    server = ctx.server
    ;({ sendRequest } = await initializeTestServer(ctx))

    const normalScopesList = [
      Scopes.Streams.Read,
      Scopes.Streams.Write,
      Scopes.Users.Read,
      Scopes.Users.Email,
      Scopes.Tokens.Write,
      Scopes.Tokens.Read,
      Scopes.Profile.Read,
      Scopes.Profile.Email
    ]

    // create users
    await Promise.all([
      createUser(userIz).then((id) => (userIz.id = id)),
      createUser(userCr).then((id) => (userCr.id = id)),
      createUser(userX).then((id) => (userX.id = id))
    ])

    // create tokens and streams
    await Promise.all([
      // tokens
      createPersonalAccessToken(userIz.id, 'izz test token', normalScopesList).then(
        (token) => (userIz.token = `Bearer ${token}`)
      ),
      createPersonalAccessToken(userCr.id, 'cristi test token', normalScopesList).then(
        (token) => (userCr.token = `Bearer ${token}`)
      ),
      createPersonalAccessToken(userX.id, 'no users:read test token', [
        Scopes.Streams.Read,
        Scopes.Streams.Write
      ]).then((token) => (userX.token = `Bearer ${token}`))
      // streams
      // createStream({ ...collaboratorTestStream, ownerId: userIz.id }).then(
      //   (id) => (collaboratorTestStream.id = id)
      // )
    ])

    // It's definitely not great that there's a full on test case in the before() hook, but that's because
    // these tests were originally written incorrectly - they depend on each other. So this is a temporary fix that
    // ensures tests can be ran in any order
    // + Avoiding GQL to bypass personal project limits, if any

    // create stream (cr1)
    await createTestStream(streamSecret, userCr)

    // create commit (cr2)
    testObj2.id = await createObject({ streamId: streamSecret.id, object: testObj2 })
    const resCommit1 = await sendRequest(userCr.token, {
      query: `mutation { commitCreate(commit: {streamId: "${streamSecret.id}", branchName: "main", objectId: "${testObj2.id}", message: "first commit"})}`
    })
    expect(noErrors(resCommit1))

    // create stream #2 (iz1)
    await createTestStream(streamPublic, userIz)

    // create branch (iz2)
    await createTestBranch({
      branch: branchPublic,
      stream: streamPublic,
      owner: userIz
    })

    // create commit #2 (iz3)
    testObj.id = await createObject({ streamId: streamPublic.id, object: testObj })
    const resCommit2 = await sendRequest(userIz.token, {
      query: `mutation { commitCreate(commit: { streamId: "${streamPublic.id}", branchName: "${branchPublic.name}", objectId: "${testObj.id}", message: "first commit" })}`
    })
    expect(noErrors(resCommit2))

    // Add stream collaborator directly
    await addOrUpdateStreamCollaborator(
      streamPublic.id,
      userCr.id,
      Roles.Stream.Reviewer,
      userIz.id
    )

    // update collaborator (iz4)
    const resCollab = await sendRequest(userIz.token, {
      query: `mutation { streamUpdatePermission( permissionParams: { streamId: "${streamPublic.id}", userId: "${userCr.id}", role: "stream:contributor" } ) }`
    })
    expect(noErrors(resCollab))

    const { items: activityC } = await getUserActivity({ userId: userCr.id })

    // 1: user created, 2: stream created, 3: commit created
    expect(activityC.length).to.equal(3)
    expect(activityC[0].actionType).to.equal('commit_create')

    const activityI = await getUserActivity({ userId: userIz.id })

    expect(activityI.items.length).to.equal(4)
    expect(activityI).to.nested.include({
      'items[0].actionType': 'commit_create',
      'items[1].actionType': 'branch_create',
      'items[2].actionType': 'stream_create',
      'items[3].actionType': 'user_create'
    })

    const activity = { items: await getActivities({ userId: userIz.id }) }

    expect(activity.items.length).to.equal(3)
    expect(activity).to.nested.include({
      'items[0].eventType': 'project_role_updated',
      'items[0].payload.new': 'stream:owner',
      'items[0].payload.old': null,
      'items[0].userId': userIz.id, // created branch

      'items[1].eventType': 'project_role_updated',
      'items[1].payload.new': 'stream:reviewer',
      'items[1].payload.old': null,
      'items[1].payload.userId': userCr.id,
      'items[1].userId': userIz.id, // added user

      'items[2].eventType': 'project_role_updated',
      'items[2].payload.new': 'stream:contributor',
      'items[2].payload.old': 'stream:reviewer',
      'items[2].payload.userId': userCr.id,
      'items[2].userId': userIz.id // made him a contibutor
    })
  })

  after(async () => {
    await server.close()
  })

  it("Should get a user's own activity", async () => {
    const res = await sendRequest(userIz.token, {
      query: `query {activeUser { name activity { totalCount items {id streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(noErrors(res))
    const activity = res.body.data.activeUser.activity

    expect(activity.items.length).to.equal(4)
    expect(activity.totalCount).to.equal(4)
    expect(activity.items[0].actionType).to.equal('commit_create')
    expect(activity.items[activity.totalCount - 1].actionType).to.equal('user_create')
  })

  it("Should get another user's activity", async () => {
    const res = await sendRequest(userIz.token, {
      query: `query {otherUser(id:"${userCr.id}") { name activity { totalCount items {id streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(noErrors(res))
    expect(res.body.data.otherUser.activity.items.length).to.equal(3)
    expect(res.body.data.otherUser.activity.totalCount).to.equal(3)
  })

  it("Should get a user's timeline", async () => {
    const res = await sendRequest(userIz.token, {
      query: `query {otherUser(id:"${userCr.id}") { name timeline { totalCount items {id streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(noErrors(res))
    expect(res.body.data.otherUser.timeline.items.length).to.equal(5) // sum of all actions in before hook
    expect(res.body.data.otherUser.timeline.totalCount).to.equal(5)
  })

  it("Should get a stream's activity", async () => {
    const res = await sendRequest(userCr.token, {
      query: `query { stream(id: "${streamPublic.id}") { activity { totalCount items {id streamId resourceId actionType message} } } }`
    })
    expect(noErrors(res))
    const activity = res.body.data.stream.activity
    expect(activity.items.length).to.equal(3)
    expect(activity.totalCount).to.equal(3)
    expect(activity.items[activity.totalCount - 1].actionType).to.equal('stream_create')
  })

  it("Should get a branch's activity", async () => {
    const res = await sendRequest(userCr.token, {
      query: `query { stream(id: "${streamPublic.id}") { branch(name: "${branchPublic.name}") { activity { totalCount items {id streamId resourceId actionType message} } } } }`
    })
    expect(noErrors(res))
    const activity = res.body.data.stream.branch.activity
    expect(activity.items.length).to.equal(1)
    expect(activity.totalCount).to.equal(1)
    expect(activity.items[0].actionType).to.equal('branch_create')
  })

  it("Should *not* get a stream's activity if you don't have access to it", async () => {
    const res = await sendRequest(userIz.token, {
      query: `query {stream(id:"${streamSecret.id}") {name activity {items {id streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(res.body.errors?.length).to.equal(1)
  })

  it("Should *not* get a stream's activity if you are not a server user", async () => {
    const res = await sendRequest(null, {
      query: `query {stream(id:"${streamPublic.id}") {name activity {items {id streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(res.body.errors?.length).to.equal(1)
  })

  it("Should *not* get a user's activity without the `users:read` scope", async () => {
    const res = await sendRequest(userX.token, {
      query: `query {otherUser(id:"${userCr.id}") { name activity {items {id streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(res.body.errors?.length).to.equal(1)
  })

  it("Should *not* get a user's timeline without the `users:read` scope", async () => {
    const res = await sendRequest(userX.token, {
      query: `query {otherUser(id:"${userCr.id}") { name timeline {items {id streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(res.body.errors?.length).to.equal(1)
  })
})
