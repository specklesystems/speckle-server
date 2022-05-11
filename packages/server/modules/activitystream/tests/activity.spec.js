/* istanbul ignore file */
const expect = require('chai').expect

const { createUser } = require('../../core/services/users')
const { createPersonalAccessToken } = require('../../core/services/tokens')
const { createObject } = require('../../core/services/objects')
const { getUserActivity } = require('../services')

const { beforeEachContext, initializeTestServer } = require('@/test/hooks')
const { noErrors } = require('@/test/helpers')

let sendRequest

describe('Activity @activity', () => {
  let server

  const userIz = {
    name: 'Izzy Lyseggen',
    email: 'izzybizzi@speckle.systems',
    password: 'sp0ckle sucks 9001'
  }

  const userCr = {
    name: 'Cristi Balas',
    email: 'cristib@speckle.systems',
    password: 'hack3r man 666'
  }

  const userX = {
    name: 'Mystery User',
    email: 'mysteriousDude@speckle.systems',
    password: 'super $ecret pw0rd'
  }

  const streamPublic = {
    name: 'a fun stream for sharing',
    description: 'for all to see!',
    isPublic: true
  }

  const branchPublic = { name: '🍁maple branch' }

  const streamSecret = {
    name: 'a secret stream for me',
    description: 'for no one to see!',
    isPublic: false
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
    const { app } = await beforeEachContext()
    ;({ server, sendRequest } = await initializeTestServer(app))

    // create users and tokens
    userIz.id = await createUser(userIz)
    const token = await createPersonalAccessToken(userIz.id, 'izz test token', [
      'streams:read',
      'streams:write',
      'users:read',
      'users:email',
      'tokens:write',
      'tokens:read',
      'profile:read',
      'profile:email'
    ])
    userIz.token = `Bearer ${token}`

    userCr.id = await createUser(userCr)
    userCr.token = `Bearer ${await createPersonalAccessToken(
      userCr.id,
      'cristi test token',
      [
        'streams:read',
        'streams:write',
        'users:read',
        'users:email',
        'tokens:write',
        'tokens:read',
        'profile:read',
        'profile:email'
      ]
    )}`

    userX.id = await createUser(userX)
    userX.token = `Bearer ${await createPersonalAccessToken(
      userX.id,
      'no users:read test token',
      ['streams:read', 'streams:write']
    )}`
  })

  after(async () => {
    await server.close()
  })

  it('Should create activity', async () => {
    // create stream (cr1)
    const resStream1 = await sendRequest(userCr.token, {
      query:
        'mutation createStream($myStream:StreamCreateInput!) { streamCreate(stream: $myStream) }',
      variables: { myStream: streamSecret }
    })
    expect(noErrors(resStream1))
    streamSecret.id = resStream1.body.data.streamCreate

    // create commit (cr2)
    testObj2.id = await createObject(streamSecret.id, testObj2)
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
    testObj.id = await createObject(streamPublic.id, testObj)
    const resCommit2 = await sendRequest(userIz.token, {
      query: `mutation { commitCreate(commit: { streamId: "${streamPublic.id}", branchName: "${branchPublic.name}", objectId: "${testObj.id}", message: "first commit" })}`
    })
    expect(noErrors(resCommit2))

    // add collaborator (iz4)
    const resCollab = await sendRequest(userIz.token, {
      query: `mutation { streamGrantPermission( permissionParams: { streamId: "${streamPublic.id}", userId: "${userCr.id}", role: "stream:contributor" } ) }`
    })
    expect(noErrors(resCollab))

    const { items: activityC } = await getUserActivity({ userId: userCr.id })
    expect(activityC.length).to.equal(3)
    expect(activityC[0].actionType).to.equal('commit_create')

    const { items: activityI } = await getUserActivity({ userId: userIz.id })
    expect(activityI.length).to.equal(5)
    expect(activityI[0].actionType).to.equal('stream_permissions_add')
  })

  it("Should get a user's own activity", async () => {
    const res = await sendRequest(userIz.token, {
      query: `query {user(id:"${userIz.id}") { name activity { totalCount items {streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(noErrors(res))
    const activity = res.body.data.user.activity

    expect(activity.items.length).to.equal(5)
    expect(activity.totalCount).to.equal(5)
    expect(activity.items[0].actionType).to.equal('stream_permissions_add')
    expect(activity.items[activity.totalCount - 1].actionType).to.equal('user_create')
  })

  it("Should get another user's activity", async () => {
    const res = await sendRequest(userIz.token, {
      query: `query {user(id:"${userCr.id}") { name activity { totalCount items {streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(noErrors(res))
    expect(res.body.data.user.activity.items.length).to.equal(3)
    expect(res.body.data.user.activity.totalCount).to.equal(3)
  })

  it("Should get a user's timeline", async () => {
    const res = await sendRequest(userIz.token, {
      query: `query {user(id:"${userCr.id}") { name timeline { totalCount items {streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(noErrors(res))
    expect(res.body.data.user.timeline.items.length).to.equal(6) // sum of all actions in 'should create activity'
    expect(res.body.data.user.timeline.totalCount).to.equal(6)
  })

  it("Should get a stream's activity", async () => {
    const res = await sendRequest(userCr.token, {
      query: `query { stream(id: "${streamPublic.id}") { activity { totalCount items {streamId resourceId actionType message} } } }`
    })
    expect(noErrors(res))
    const activity = res.body.data.stream.activity
    expect(activity.items.length).to.equal(4)
    expect(activity.totalCount).to.equal(4)
    expect(activity.items[activity.totalCount - 1].actionType).to.equal('stream_create')
  })

  it("Should get a branch's activity", async () => {
    const res = await sendRequest(userCr.token, {
      query: `query { stream(id: "${streamPublic.id}") { branch(name: "${branchPublic.name}") { activity { totalCount items {streamId resourceId actionType message} } } } }`
    })
    expect(noErrors(res))
    const activity = res.body.data.stream.branch.activity
    expect(activity.items.length).to.equal(1)
    expect(activity.totalCount).to.equal(1)
    expect(activity.items[0].actionType).to.equal('branch_create')
  })

  it("Should *not* get a stream's activity if you don't have access to it", async () => {
    const res = await sendRequest(userIz.token, {
      query: `query {stream(id:"${streamSecret.id}") {name activity {items {streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(res.body.errors.length).to.equal(1)
  })

  it("Should *not* get a stream's activity if you are not a server user", async () => {
    const res = await sendRequest(null, {
      query: `query {stream(id:"${streamPublic.id}") {name activity {items {streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(res.body.errors.length).to.equal(1)
  })

  it("Should *not* get a user's activity without the `users:read` scope", async () => {
    const res = await sendRequest(userX.token, {
      query: `query {user(id:"${userCr.id}") { name activity {items {streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(res.body.errors.length).to.equal(1)
  })

  it("Should *not* get a user's timeline without the `users:read` scope", async () => {
    const res = await sendRequest(userX.token, {
      query: `query {user(id:"${userCr.id}") { name timeline {items {streamId resourceType resourceId actionType userId message time}}} }`
    })
    expect(res.body.errors.length).to.equal(1)
  })
})
