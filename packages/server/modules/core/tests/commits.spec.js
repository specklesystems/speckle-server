/* istanbul ignore file */
const expect = require('chai').expect

const { beforeEachContext } = require('@/test/hooks')

const { createUser } = require('../services/users')
const { createStream } = require('../services/streams')
const { createObject } = require('../services/objects')
const { createBranch } = require('../services/branches')

const {
  createCommitByBranchName,
  updateCommit,
  getCommitById,
  deleteCommit,
  getCommitsTotalCountByBranchName,
  getCommitsByBranchName,
  getCommitsByStreamId,
  getCommitsTotalCountByStreamId,
  getCommitsByUserId
} = require('../services/commits')

describe('Commits @core-commits', () => {
  const user = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie4342@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  const stream = {
    name: 'Test Stream References',
    description: 'Whatever goes in here usually...'
  }

  const testObject = {
    foo: 'bar',
    baz: 'qux'
  }

  const testObject2 = {
    foo: 'bar3',
    baz: 'qux3'
  }

  const testObject3 = {
    foo: 'bar4',
    baz: 'qux5'
  }

  const generateObject = async (streamId = stream.id, object = testObject) =>
    await createObject(streamId, object)
  const generateStream = async (streamBase = stream, ownerId = user.id) =>
    await createStream({ ...streamBase, ownerId })

  let commitId1, commitId2, commitId3

  before(async () => {
    await beforeEachContext()

    user.id = await createUser(user)
    stream.id = await createStream({ ...stream, ownerId: user.id })

    const testObjectId = await createObject(stream.id, testObject)
    const testObject2Id = await createObject(stream.id, testObject2)
    const testObject3Id = await createObject(stream.id, testObject3)

    commitId1 = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'first commit',
      sourceApplication: 'tests',
      objectId: testObjectId,
      authorId: user.id
    })

    commitId2 = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'second commit',
      sourceApplication: 'tests',
      objectId: testObject2Id,
      authorId: user.id,
      parents: [commitId1]
    })

    commitId3 = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'third commit',
      sourceApplication: 'tests',
      objectId: testObject3Id,
      authorId: user.id,
      parents: [commitId1, commitId2]
    })
  })

  it('Should create a commit by branch name', async () => {
    const objectId = await generateObject()
    const id = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'first commit',
      sourceApplication: 'tests',
      objectId,
      authorId: user.id
    })
    expect(id).to.be.a.string
  })

  it('Should create a commit with a previous commit id', async () => {
    const objectId = await generateObject()
    const objectId2 = await generateObject()

    const id = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'second commit',
      sourceApplication: 'tests',
      objectId,
      authorId: user.id,
      parents: [commitId1]
    })
    expect(id).to.be.a.string

    const id2 = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'third commit',
      sourceApplication: 'tests',
      objectId: objectId2,
      authorId: user.id,
      parents: [commitId1, commitId2]
    })

    expect(id2).to.be.a.string
  })

  it('Should update a commit', async () => {
    const res = await updateCommit({
      id: commitId1,
      message: 'FIRST COMMIT YOOOOOO',
      userId: user.id,
      streamId: stream.id
    })
    expect(res).to.equal(true)
  })

  it('Should delete a commit', async () => {
    const objectId = await generateObject()
    const tempCommit = await createCommitByBranchName({
      streamId: stream.id,
      branchName: 'main',
      message: 'temp commit',
      sourceApplication: 'tests',
      objectId,
      authorId: user.id
    })

    const res = await deleteCommit({
      commitId: tempCommit,
      streamId: stream.id,
      userId: user.id
    })
    expect(res).to.be.ok
  })

  it('Should get a commit by id', async () => {
    const cm = await getCommitById({ streamId: stream.id, id: commitId1 })
    expect(cm.message).to.equal('FIRST COMMIT YOOOOOO')
    expect(cm.authorId).to.equal(user.id)
  })

  it('Should get the commits and their total count from a branch', async () => {
    const streamId = await generateStream()

    for (let i = 0; i < 10; i++) {
      const t = { qux: i }
      t.id = await createObject(streamId, t)
      await createCommitByBranchName({
        streamId,
        branchName: 'main',
        message: `commit # ${i + 3}`,
        sourceApplication: 'tests',
        objectId: t.id,
        authorId: user.id
      })
    }

    const { commits, cursor } = await getCommitsByBranchName({
      streamId,
      branchName: 'main',
      limit: 2
    })
    expect(commits).to.be.an('array')
    expect(commits.length).to.equal(2)

    const { commits: commits2 } = await getCommitsByBranchName({
      streamId,
      branchName: 'main',
      limit: 5,
      cursor
    })
    expect(commits2.length).to.equal(5)

    const c = await getCommitsTotalCountByBranchName({
      streamId,
      branchName: 'main'
    })
    expect(c).to.equal(10)
  })

  it('Should get the commits and their total count from a stream', async () => {
    const streamId = await generateStream()
    await createBranch({ name: 'dim/dev', streamId, authorId: user.id })

    for (let i = 0; i < 15; i++) {
      const t = { thud: i }
      t.id = await createObject(streamId, t)
      await createCommitByBranchName({
        streamId,
        branchName: 'dim/dev',
        message: `pushed something # ${i + 3}`,
        sourceApplication: 'tests',
        objectId: t.id,
        authorId: user.id
      })
    }

    const { commits, cursor } = await getCommitsByStreamId({
      streamId,
      limit: 10
    })
    const { commits: commits2 } = await getCommitsByStreamId({
      streamId,
      limit: 20,
      cursor
    })

    expect(commits.length).to.equal(10)
    expect(commits2.length).to.equal(5)

    const c = await getCommitsTotalCountByStreamId({ streamId })
    expect(c).to.equal(15)
  })

  it('Commits should have source, total count, branch name and parents fields', async () => {
    const { commits: userCommits } = await getCommitsByUserId({
      userId: user.id,
      limit: 1000
    })
    const userCommit = userCommits[0]

    const { commits: streamCommits } = await getCommitsByStreamId({
      streamId: stream.id,
      limit: 10
    })
    const serverCommit = streamCommits[0]

    const { commits: branchCommits } = await getCommitsByBranchName({
      streamId: stream.id,
      branchName: 'main',
      limit: 2
    })
    const branchCommit = branchCommits[0]

    const idCommit = await getCommitById({ streamId: stream.id, id: commitId3 })

    for (const commit of [userCommit, serverCommit, branchCommit, idCommit]) {
      expect(commit).to.have.property('sourceApplication')
      expect(commit.sourceApplication).to.be.a('string')

      expect(commit).to.have.property('totalChildrenCount')
      expect(commit.totalChildrenCount).to.be.a('number')

      expect(commit).to.have.property('parents')
    }

    expect(idCommit.parents).to.be.a('array')
    expect(idCommit.parents.length).to.equal(2)
  })

  it('Should have an array of parents', async () => {
    const commits = [
      await getCommitById({ streamId: stream.id, id: commitId3 }),
      await getCommitById({ streamId: stream.id, id: commitId2 })
    ]

    for (const commit of commits) {
      expect(commit).to.have.property('parents')
      expect(commit.parents).to.be.a('array')
      expect(commit.parents.length).to.greaterThan(0)
    }
  })
})
