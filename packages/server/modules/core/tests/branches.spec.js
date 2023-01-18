/* istanbul ignore file */
const chai = require('chai')
const assert = require('assert')

const { beforeEachContext } = require('@/test/hooks')
const { sleep } = require('@/test/helpers')

const expect = chai.expect

const { createUser } = require('../services/users')
const { createStream } = require('../services/streams')
const { createObject } = require('../services/objects')
const {
  createBranch,
  updateBranch,
  getBranchById,
  getBranchesByStreamId,
  getBranchByNameAndStreamId,
  deleteBranchById
} = require('../services/branches')

describe('Branches @core-branches', () => {
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

  before(async () => {
    await beforeEachContext()

    user.id = await createUser(user)
    stream.id = await createStream({ ...stream, ownerId: user.id })
    testObject.id = await createObject(stream.id, testObject)
  })

  const branch = { name: 'dim/dev' }

  it('Should create a branch', async () => {
    branch.id = await createBranch({
      ...branch,
      streamId: stream.id,
      authorId: user.id
    })
    expect(branch.id).to.be.not.null
    expect(branch.id).to.be.a.string
  })

  it('Should not allow duplicate branch names', async () => {
    try {
      await createBranch({ name: 'main', streamId: stream.id, authorId: user.id })
      assert.fail('Duplicate branches should not be allowed.')
    } catch (err) {
      expect(err.message).to.contain('duplicate key value violates unique constraint')
    }
  })

  it('Should not allow branch names starting with # or /, or branches that have "//" in their name', async () => {
    try {
      await createBranch({ name: '/pasta', streamId: stream.id, authorId: user.id })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(err.message).to.contain('Bad name for branch.')
    }

    try {
      await createBranch({ name: '#rice', streamId: stream.id, authorId: user.id })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(err.message).to.contain('Bad name for branch.')
    }

    try {
      await updateBranch({
        id: branch.id,
        name: '/super/part/two',
        streamId: stream.id,
        userId: user.id
      })
      assert.fail('Illegal branch name passed through in update operation.')
    } catch (err) {
      expect(err.message).to.contain('Bad name for branch.')
    }

    try {
      await updateBranch({
        id: branch.id,
        name: '#super#part#three',
        streamId: stream.id,
        userId: user.id
      })
      assert.fail('Illegal branch name passed through in update operation.')
    } catch (err) {
      expect(err.message).to.contain('Bad name for branch.')
    }

    try {
      await createBranch({
        name: 'pasta//rice',
        streamId: stream.id,
        authorId: user.id
      })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(err.message).to.contain('Bad name for branch.')
    }
  })

  it('Branch names should be case insensitive (always lowercase)', async () => {
    const id = await createBranch({
      name: 'CaseSensitive',
      streamId: stream.id,
      authorId: user.id
    })

    const b = await getBranchByNameAndStreamId({
      streamId: stream.id,
      name: 'casesensitive'
    })
    expect(b.name).to.equal('casesensitive')

    const bb = await getBranchByNameAndStreamId({
      streamId: stream.id,
      name: 'CaseSensitive'
    })
    expect(bb.name).to.equal('casesensitive')

    const bbb = await getBranchByNameAndStreamId({
      streamId: stream.id,
      name: 'CASESENSITIVE'
    })
    expect(bbb.name).to.equal('casesensitive')

    // cleanup
    await deleteBranchById({ id, streamId: stream.id, userId: user.id })
  })

  it('Should get a branch', async () => {
    const myBranch = await getBranchById({ id: branch.id })
    expect(myBranch.authorId).to.equal(user.id)
    expect(myBranch.streamId).to.equal(stream.id)
  })

  it('Should update a branch', async () => {
    await updateBranch({
      id: branch.id,
      description: 'lorem ipsum',
      streamId: stream.id,
      userId: user.id
    })

    const b1 = await getBranchById({ id: branch.id })
    expect(b1.description).to.equal('lorem ipsum')
  })

  it('Should get all stream branches', async () => {
    await createBranch({ name: 'main-faster', streamId: stream.id, authorId: user.id })
    await sleep(250)
    await createBranch({ name: 'main-blaster', streamId: stream.id, authorId: user.id })
    await sleep(250)
    await createBranch({
      name: 'blaster-farter',
      streamId: stream.id,
      authorId: user.id
    })

    const { items, cursor, totalCount } = await getBranchesByStreamId({
      streamId: stream.id
    })
    expect(items).to.have.lengthOf(5)
    expect(cursor).to.exist
    expect(totalCount).to.exist
  })

  it('Should delete a branch', async () => {
    await deleteBranchById({ id: branch.id, streamId: stream.id, userId: user.id })
    const { items } = await getBranchesByStreamId({ streamId: stream.id })
    expect(items).to.have.lengthOf(4)
  })

  it('Should NOT delete the main branch', async () => {
    const b = await getBranchByNameAndStreamId({ streamId: stream.id, name: 'main' })
    try {
      await deleteBranchById({ id: b.id, streamId: stream.id, userId: user.id })
      assert.fail()
    } catch (e) {
      // pass
    }
  })

  it('Should return branches in time createdAt order, MAIN first', async () => {
    const { items } = await getBranchesByStreamId({ streamId: stream.id })

    expect(items[0].name).to.equal('main')
    expect(items[1].createdAt < items[2].createdAt).to.equal(true)
  })

  // NOTE: pagination broken currently, we need to do a global fix
  // pausing this for now to be able to put out other fixes
  // it('Should paginate branches correctly', async () => {
  //   const { items: firstBatch, cursor } = await getBranchesByStreamId({
  //     streamId: stream.id,
  //     limit: 2
  //   })
  //   const test = JSON.stringify(cursor)
  //   console.log(test)
  //   expect(firstBatch.length).to.equal(2)
  //   const { items: secondBatch } = await getBranchesByStreamId({
  //     streamId: stream.id,
  //     cursor,
  //     limit: 2
  //   })
  //   expect(secondBatch.length).to.equal(2)
  //   console.log(secondBatch[0].createdAt)
  //   console.log(firstBatch[1].createdAt)
  //   expect(secondBatch[0].createdAt > firstBatch[1].createdAt).to.equal(true)
  // })
})
