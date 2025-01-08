/* istanbul ignore file */
const expect = require('chai').expect

const { beforeEachContext, initializeTestServer } = require('@/test/hooks')
const { noErrors } = require('@/test/helpers')

const { Roles, Scopes } = require('@speckle/shared')
const {
  getUserActivityFactory,
  saveActivityFactory
} = require('@/modules/activitystream/repositories')
const { db } = require('@/db/knex')
const {
  validateStreamAccessFactory,
  addOrUpdateStreamCollaboratorFactory
} = require('@/modules/core/services/streams/access')
const { authorizeResolver } = require('@/modules/shared')
const { grantStreamPermissionsFactory } = require('@/modules/core/repositories/streams')
const {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory
} = require('@/modules/activitystream/services/streamActivity')
const { publish } = require('@/modules/shared/utils/subscriptions')
const {
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} = require('@/modules/core/repositories/users')
const {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} = require('@/modules/core/repositories/userEmails')
const {
  requestNewEmailVerificationFactory
} = require('@/modules/emails/services/verification/request')
const {
  deleteOldAndInsertNewVerificationFactory
} = require('@/modules/emails/repositories')
const { renderEmail } = require('@/modules/emails/services/emailRendering')
const { sendEmail } = require('@/modules/emails/services/sending')
const { createUserFactory } = require('@/modules/core/services/users/management')
const {
  validateAndCreateUserEmailFactory
} = require('@/modules/core/services/userEmails')
const {
  finalizeInvitedServerRegistrationFactory
} = require('@/modules/serverinvites/services/processing')
const {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const { UsersEmitter } = require('@/modules/core/events/usersEmitter')
const { createPersonalAccessTokenFactory } = require('@/modules/core/services/tokens')
const {
  storePersonalApiTokenFactory,
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory
} = require('@/modules/core/repositories/tokens')
const { getServerInfoFactory } = require('@/modules/core/repositories/server')
const { createObjectFactory } = require('@/modules/core/services/objects/management')
const {
  storeSingleObjectIfNotFoundFactory,
  storeClosuresIfNotFoundFactory
} = require('@/modules/core/repositories/objects')

const getUser = getUserFactory({ db })
const getUserActivity = getUserActivityFactory({ db })
const saveActivity = saveActivityFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
    saveActivity,
    publish
  }),
  addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
    saveActivity,
    publish
  })
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
  usersEventsEmitter: UsersEmitter.emit
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
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db }),
  storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
})

let server
let sendRequest

describe('Activity @activity', () => {
  const userIz = {
    name: 'Izzy Lyseggen',
    email: 'izzybizzi@speckle.systems',
    password: 'sp0ckle sucks 9001',
    id: undefined
  }

  const userCr = {
    name: 'Cristi Balas',
    email: 'cristib@speckle.systems',
    password: 'hack3r man 666',
    id: undefined
  }

  const userX = {
    name: 'Mystery User',
    email: 'mysteriousDude@speckle.systems',
    password: 'super $ecret pw0rd',
    id: undefined
  }

  const streamPublic = {
    name: 'a fun stream for sharing',
    description: 'for all to see!',
    isPublic: true,
    id: undefined
  }

  // const collaboratorTestStream = {
  //   name: 'a fun stream for testing collab stuff',
  //   description: 'for all to see!',
  //   isPublic: true,
  //   id: undefined
  // }

  const branchPublic = { name: '🍁maple branch' }

  const streamSecret = {
    name: 'a secret stream for me',
    description: 'for no one to see!',
    isPublic: false,
    id: undefined
  }

  const testObj = {
    hello: 'hallo',
    cool: 'kult',
    bunny: 'kanin'
  }
  const testObj2 = {
    goodbye: 'ha det bra',
    warm: 'varmt',
    bunny: 'kanin'
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

    // create stream (cr1)
    const resStream1 = await sendRequest(userCr.token, {
      query:
        'mutation createStream($myStream:StreamCreateInput!) { streamCreate(stream: $myStream) }',
      variables: { myStream: streamSecret }
    })
    expect(noErrors(resStream1))
    streamSecret.id = resStream1.body.data.streamCreate

    // create commit (cr2)
    testObj2.id = await createObject({ streamId: streamSecret.id, object: testObj2 })
    const resCommit1 = await sendRequest(userCr.token, {
      query: `mutation { commitCreate(commit: {streamId: "${streamSecret.id}", branchName: "main", objectId: "${testObj2.id}", message: "first commit"})}`
    })
    expect(noErrors(resCommit1))

    // create stream #2 (iz1)
    const resStream2 = await sendRequest(userIz.token, {
      query:
        'mutation createStream($myStream:StreamCreateInput!) { streamCreate(stream: $myStream) }',
      variables: { myStream: streamPublic }
    })
    expect(noErrors(resStream2))
    streamPublic.id = resStream2.body.data.streamCreate

    // create branch (iz2)
    const resBranch = await sendRequest(userIz.token, {
      query: `mutation { branchCreate(branch: { streamId: "${streamPublic.id}", name: "${branchPublic.name}" }) }`
    })
    expect(noErrors(resBranch))
    branchPublic.id = resBranch.body.data.branchCreate

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

    const { items: activityI } = await getUserActivity({ userId: userIz.id })

    // iz1 to iz4 + user created + user added as collaborator
    expect(activityI.length).to.equal(6)
    expect(activityI[0].actionType).to.equal('stream_permissions_add')
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

    expect(activity.items.length).to.equal(6)
    expect(activity.totalCount).to.equal(6)
    expect(activity.items[0].actionType).to.equal('stream_permissions_add')
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
    expect(res.body.data.otherUser.timeline.items.length).to.equal(7) // sum of all actions in before hook
    expect(res.body.data.otherUser.timeline.totalCount).to.equal(7)
  })

  it("Should get a stream's activity", async () => {
    const res = await sendRequest(userCr.token, {
      query: `query { stream(id: "${streamPublic.id}") { activity { totalCount items {id streamId resourceId actionType message} } } }`
    })
    expect(noErrors(res))
    const activity = res.body.data.stream.activity
    expect(activity.items.length).to.equal(5)
    expect(activity.totalCount).to.equal(5)
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
