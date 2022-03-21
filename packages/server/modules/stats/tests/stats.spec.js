/* istanbul ignore file */
const expect = require('chai').expect

const appRoot = require('app-root-path')

const { createUser } = require(`${appRoot}/modules/core/services/users`)
const { createPersonalAccessToken } = require(`${appRoot}/modules/core/services/tokens`)
const { createStream } = require(`${appRoot}/modules/core/services/streams`)
const { createObjects } = require(`${appRoot}/modules/core/services/objects`)
const { createCommitByBranchName } = require(`${appRoot}/modules/core/services/commits`)

const { beforeEachContext, initializeTestServer } = require(`${appRoot}/test/hooks`)
const { createManyObjects } = require(`${appRoot}/test/helpers`)

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
    console.log(new Date().toISOString(), 'BEFORE() 1')
    this.timeout(20000)

    await beforeEachContext()
    console.log(new Date().toISOString(), 'BEFORE()2')

    await seedDb(params)
    console.log(new Date().toISOString(), 'BEFORE() 3')
  })

  it('should return the total number of users on this server', async () => {
    console.log(new Date().toISOString(), 'T 1')

    let res = await getTotalUserCount()
    console.log(new Date().toISOString(), 'T2')

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
    this.timeout(10000)

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

async function seedDb({ numUsers = 10, numStreams = 10, numObjects = 10, numCommits = 10 } = {}) {
  let users = []
  let streams = []

  console.log(new Date().toISOString(), '')

  // create users
  for (let i = 0; i < numUsers; i++) {
    let id = await createUser({
      name: `User ${i}`,
      password: `SuperSecure${i}${i * 3.14}`,
      email: `user${i}@speckle.systems`
    })
    users.push(id)
  }

  // create streams
  for (let i = 0; i < numStreams; i++) {
    let id = await createStream({
      name: `Stream ${i}`,
      ownerId: users[i >= users.length ? users.length - 1 : i]
    })
    streams.push(id)
  }

  // create a objects
  let mockObjects = createManyObjects(numObjects - 1)
  let objs = await createObjects(streams[0], mockObjects)
  let commits = []

  // create commits referencing those objects
  for (let i = 0; i < numCommits; i++) {
    let id = await createCommitByBranchName({
      streamId: streams[0],
      branchName: 'main',
      sourceApplication: 'tests',
      objectId: objs[i >= objs.length ? objs.length - 1 : i]
    })
    commits.push(id)
  }
}
