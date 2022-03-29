/* istanbul ignore file */
const expect = require('chai').expect

const { createUser } = require(`@/modules/core/services/users`)
const { createPersonalAccessToken } = require(`@/modules/core/services/tokens`)
const { createStream } = require(`@/modules/core/services/streams`)
const { createObjects } = require(`@/modules/core/services/objects`)
const { createCommitByBranchName } = require(`@/modules/core/services/commits`)

const { beforeEachContext, initializeTestServer } = require(`@/test/hooks`)
const { createManyObjects } = require(`@/test/helpers`)

const {
  getStreamHistory,
  getCommitHistory,
  getObjectHistory,
  getUserHistory,
  getTotalStreamCount,
  getTotalCommitCount,
  getTotalObjectCount,
  getTotalUserCount
} = require('../services')

const params = { numUsers: 25, numStreams: 30, numObjects: 100, numCommits: 100 }

describe('Server stats services @stats-services', function () {
  before(async function () {
    this.timeout(15000)
    await beforeEachContext()
    await seedDb(params)
  })

  it('should return the total number of users on this server', async () => {
    let res = await getTotalUserCount()
    expect(res).to.equal(params.numUsers)
  })

  it('should return the total number of streams on this server', async () => {
    let res = await getTotalStreamCount()
    expect(res).to.equal(params.numStreams)
  })

  it('should return the total number of commits on this server', async () => {
    let res = await getTotalCommitCount()
    expect(res).to.equal(params.numCommits)
  })

  it('should return the total number of objects on this server', async () => {
    let res = await getTotalObjectCount()
    expect(res).to.equal(params.numObjects)
  })

  it('should return the stream creation history by month', async () => {
    let res = await getStreamHistory()
    expect(res).to.be.an('array')
    expect(res[0]).to.have.property('count')
    expect(res[0]).to.have.property('created_month')
    expect(res[0].count).to.be.a('number')
    expect(res[0].count).to.equal(params.numStreams)
  })

  it('should return the commit creation history by month', async () => {
    let res = await getCommitHistory()
    expect(res).to.be.an('array')
    expect(res[0]).to.have.property('count')
    expect(res[0]).to.have.property('created_month')
    expect(res[0].count).to.be.a('number')
    expect(res[0].count).to.equal(params.numCommits)
  })

  it('should return the object creation history by month', async () => {
    let res = await getObjectHistory()
    expect(res).to.be.an('array')
    expect(res[0]).to.have.property('count')
    expect(res[0]).to.have.property('created_month')
    expect(res[0].count).to.be.a('number')
    expect(res[0].count).to.equal(params.numObjects)
  })

  it('should return the user creation history by month', async () => {
    let res = await getUserHistory()
    expect(res).to.be.an('array')
    expect(res[0]).to.have.property('count')
    expect(res[0]).to.have.property('created_month')
    expect(res[0].count).to.be.a('number')
    expect(res[0].count).to.equal(params.numUsers)
  })
})

describe('Server stats api @stats-api', function () {
  let server, sendRequest

  let adminUser = {
    name: 'Dimitrie',
    password: 'TestPasswordSecure',
    email: 'spam@spam.spam'
  }

  let notAdminUser = {
    name: 'Andrei',
    password: 'TestPasswordSecure',
    email: 'spasm@spam.spam'
  }

  let fullQuery = `
  query{
    serverStats{
      totalStreamCount
      totalCommitCount
      totalObjectCount
      totalUserCount
      streamHistory
      commitHistory
      objectHistory
      userHistory
      }
    }
    `

  before(async function () {
    this.timeout(15000)

    let { app } = await beforeEachContext()
    ;({ server, sendRequest } = await initializeTestServer(app))

    adminUser.id = await createUser(adminUser)
    adminUser.goodToken = `Bearer ${await createPersonalAccessToken(
      adminUser.id,
      'test token user A',
      ['server:stats']
    )}`
    adminUser.badToken = `Bearer ${await createPersonalAccessToken(
      adminUser.id,
      'test token user A',
      ['streams:read']
    )}`

    notAdminUser.id = await createUser(notAdminUser)
    notAdminUser.goodToken = `Bearer ${await createPersonalAccessToken(
      notAdminUser.id,
      'test token user A',
      ['server:stats']
    )}`
    notAdminUser.badToken = `Bearer ${await createPersonalAccessToken(
      notAdminUser.id,
      'test token user A',
      ['streams:read']
    )}`

    await seedDb(params)
  })

  after(async function () {
    await server.close()
  })

  it('Should not get stats if user is not admin', async () => {
    let res = await sendRequest(adminUser.badToken, { query: fullQuery })
    expect(res.body.errors).to.exist
    expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
  })

  it('Should not get stats if user is not admin even if the token has the correct scopes', async () => {
    let res = await sendRequest(notAdminUser.goodToken, { query: fullQuery })
    expect(res.body.errors).to.exist
    expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
  })

  it('Should not get stats if token does not have required scope', async () => {
    let res = await sendRequest(adminUser.badToken, { query: fullQuery })
    expect(res).to.be.json
    expect(res.body.errors).to.exist
    expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
  })

  it('Should get server stats', async () => {
    let res = await sendRequest(adminUser.goodToken, { query: fullQuery })
    expect(res).to.be.json
    expect(res.body.errors).to.not.exist

    expect(res.body.data).to.have.property('serverStats')
    expect(res.body.data.serverStats).to.have.property('totalStreamCount')
    expect(res.body.data.serverStats).to.have.property('totalCommitCount')
    expect(res.body.data.serverStats).to.have.property('totalObjectCount')
    expect(res.body.data.serverStats).to.have.property('totalUserCount')
    expect(res.body.data.serverStats).to.have.property('streamHistory')
    expect(res.body.data.serverStats).to.have.property('commitHistory')
    expect(res.body.data.serverStats).to.have.property('userHistory')

    expect(res.body.data.serverStats.totalStreamCount).to.equal(params.numStreams)
    expect(res.body.data.serverStats.totalCommitCount).to.equal(params.numCommits)
    expect(res.body.data.serverStats.totalObjectCount).to.equal(params.numObjects)
    expect(res.body.data.serverStats.totalUserCount).to.equal(params.numUsers + 2) // we're registering two extra users in the before hook

    expect(res.body.data.serverStats.streamHistory).to.be.an('array')
    expect(res.body.data.serverStats.commitHistory).to.be.an('array')
    expect(res.body.data.serverStats.userHistory).to.be.an('array')
  })
})

async function seedDb({
  numUsers = 10,
  numStreams = 10,
  numObjects = 10,
  numCommits = 10
} = {}) {
  // create users
  const userPromises = []
  for (let i = 0; i < numUsers; i++) {
    const promise = createUser({
      name: `User ${i}`,
      password: `SuperSecure${i}${i * 3.14}`,
      email: `user${i}@speckle.systems`
    })
    userPromises.push(promise)
  }

  const userIds = await Promise.all(userPromises)

  // create streams
  const streamPromises = []
  for (let i = 0; i < numStreams; i++) {
    const promise = createStream({
      name: `Stream ${i}`,
      ownerId: userIds[i >= userIds.length ? userIds.length - 1 : i]
    })
    streamPromises.push(promise)
  }

  const streamIds = await Promise.all(streamPromises)

  // create a objects
  const objs = await createObjects(streamIds[0], createManyObjects(numObjects - 1))

  // create commits referencing those objects
  const commitPromises = []
  for (let i = 0; i < numCommits; i++) {
    const promise = createCommitByBranchName({
      streamId: streamIds[0],
      branchName: 'main',
      sourceApplication: 'tests',
      objectId: objs[i >= objs.length ? objs.length - 1 : i]
    })
    commitPromises.push(promise)
  }

  await Promise.all(commitPromises)
}
