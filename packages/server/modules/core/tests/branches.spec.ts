/* istanbul ignore file */
import chai from 'chai'
import assert from 'assert'

import { beforeEachContext } from '@/test/hooks'
import { sleep } from '@/test/helpers'

const expect = chai.expect

import { knex } from '@/db/knex'

import {
  updateBranchAndNotifyFactory,
  deleteBranchAndNotifyFactory
} from '@/modules/core/services/branch/management'
import {
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  createBranchFactory,
  updateBranchFactory,
  deleteBranchByIdFactory,
  markCommitBranchUpdatedFactory,
  getPaginatedStreamBranchesPageFactory,
  getStreamBranchCountFactory
} from '@/modules/core/repositories/branches'
import {
  getStreamFactory,
  markBranchStreamUpdatedFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} from '@/modules/core/services/commit/management'
import {
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getObjectFactory,
  storeSingleObjectIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getPaginatedStreamBranchesFactory } from '@/modules/core/services/branch/retrieval'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import { ensureError } from '@speckle/shared'
import { ModelEvents } from '@/modules/core/domain/branches/events'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import {
  createTestStream,
  type BasicTestStream
} from '@/test/speckle-helpers/streamHelper'
import { buildBasicTestProject } from '@/modules/core/tests/helpers/creation'

const db = knex
const Commits = () => knex('commits')
const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db })
const getStream = getStreamFactory({ db: knex })
const getBranchById = getBranchByIdFactory({ db: knex })
const getStreamBranchByName = getStreamBranchByNameFactory({ db: knex })
const createBranch = createBranchFactory({ db: knex })
const updateBranchAndNotify = updateBranchAndNotifyFactory({
  getBranchById: getBranchByIdFactory({ db: knex }),
  updateBranch: updateBranchFactory({ db: knex }),
  eventEmit: getEventBus().emit
})
const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
  getStream,
  getBranchById: getBranchByIdFactory({ db: knex }),
  emitEvent: getEventBus().emit,
  markBranchStreamUpdated,
  deleteBranchById: deleteBranchByIdFactory({ db: knex })
})

const getObject = getObjectFactory({ db: knex })
const createCommitByBranchId = createCommitByBranchIdFactory({
  createCommit: createCommitFactory({ db }),
  getObject,
  getBranchById: getBranchByIdFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  emitEvent: getEventBus().emit
})

const createCommitByBranchName = createCommitByBranchNameFactory({
  createCommitByBranchId,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchById: getBranchByIdFactory({ db })
})

const getBranchesByStreamId = getPaginatedStreamBranchesFactory({
  getPaginatedStreamBranchesPage: getPaginatedStreamBranchesPageFactory({ db }),
  getStreamBranchCount: getStreamBranchCountFactory({ db })
})
const createObject = createObjectFactory({
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db })
})

describe('Branches @core-branches', () => {
  let user: BasicTestUser
  let stream: BasicTestStream
  const testObject = {
    foo: 'bar',
    baz: 'qux',
    id: ''
  }

  let quitters: (() => void)[] = []

  before(async () => {
    await beforeEachContext()

    user = await createTestUser({
      name: 'Dimitrie Stefanescu',
      email: 'didimitrie4342@example.org',
      password: 'sn3aky-1337-b1m',
      id: ''
    })
    stream = await createTestStream(
      buildBasicTestProject({
        name: 'Test Stream References',
        description: 'Whatever goes in here usually...'
      }),
      user
    )
    testObject.id = await createObject({ streamId: stream.id, object: testObject })
  })

  afterEach(() => {
    quitters.forEach((quit) => quit())
    quitters = []
  })

  const branch = { name: 'dim/dev', id: '', description: null }

  it('Should create a branch', async () => {
    branch.id = (
      await createBranch({
        ...branch,
        streamId: stream.id,
        authorId: user.id
      })
    ).id
    expect(branch.id).to.be.not.null
    expect(branch.id).to.be.a.string
  })

  it('Should not allow duplicate branch names', async () => {
    try {
      await createBranch({
        name: 'main',
        streamId: stream.id,
        authorId: user.id,
        description: null
      })
      assert.fail('Duplicate branches should not be allowed.')
    } catch (err) {
      expect(ensureError(err).message).to.contain(
        'duplicate key value violates unique constraint'
      )
    }
  })

  it('Should not allow branch names starting with # or /, or branches that have "//" in their name', async () => {
    try {
      await createBranch({
        name: '/pasta',
        streamId: stream.id,
        authorId: user.id,
        description: null
      })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(ensureError(err).message).to.contain('Model names cannot start with')
    }

    try {
      await createBranch({
        name: '#rice',
        streamId: stream.id,
        authorId: user.id,
        description: null
      })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(ensureError(err).message).to.contain('Model names cannot start with')
    }

    try {
      await updateBranchAndNotify(
        {
          id: branch.id,
          name: '/super/part/two',
          streamId: stream.id
        },
        user.id
      )
      assert.fail('Illegal branch name passed through in update operation.')
    } catch (err) {
      expect(ensureError(err).message).to.contain('Model names cannot start with')
    }

    try {
      await updateBranchAndNotify(
        {
          id: branch.id,
          name: '#super#part#three',
          streamId: stream.id
        },
        user.id
      )
      assert.fail('Illegal branch name passed through in update operation.')
    } catch (err) {
      expect(ensureError(err).message).to.contain('Model names cannot start with')
    }

    try {
      await createBranch({
        name: 'pasta//rice',
        streamId: stream.id,
        authorId: user.id,
        description: null
      })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(ensureError(err).message).to.contain('Model names cannot start with')
    }
  })

  it('Branch names should be case insensitive (always lowercase)', async () => {
    const id = (
      await createBranch({
        name: 'CaseSensitive',
        streamId: stream.id,
        authorId: user.id,
        description: null
      })
    ).id

    const b = await getStreamBranchByName(stream.id, 'casesensitive')
    expect(b!.name).to.equal('casesensitive')

    const bb = await getStreamBranchByName(stream.id, 'CaseSensitive')
    expect(bb!.name).to.equal('casesensitive')

    const bbb = await getStreamBranchByName(stream.id, 'CASESENSITIVE')
    expect(bbb!.name).to.equal('casesensitive')

    // cleanup
    await deleteBranchAndNotify({ id, streamId: stream.id }, user.id)
  })

  it('Should get a branch', async () => {
    const myBranch = await getBranchById(branch.id)
    expect(myBranch!.authorId).to.equal(user.id)
    expect(myBranch!.streamId).to.equal(stream.id)
  })

  it('Should update a branch', async () => {
    await updateBranchAndNotify(
      {
        id: branch.id,
        description: 'lorem ipsum',
        streamId: stream.id
      },
      user.id
    )

    const b1 = await getBranchById(branch.id)
    expect(b1!.description).to.equal('lorem ipsum')
  })

  it('Should get all stream branches', async () => {
    await createBranch({
      name: 'main-faster',
      streamId: stream.id,
      authorId: user.id,
      description: null
    })
    await sleep(1)
    await createBranch({
      name: 'main-blaster',
      streamId: stream.id,
      authorId: user.id,
      description: null
    })
    await sleep(1)
    await createBranch({
      name: 'blaster-farter',
      streamId: stream.id,
      authorId: user.id,
      description: null
    })

    const { items, cursor, totalCount } = await getBranchesByStreamId(stream.id)
    expect(items).to.have.lengthOf(5)
    expect(cursor).to.exist
    expect(totalCount).to.exist
  })

  it('Should delete a branch', async () => {
    let deleteEventFired = false
    quitters.push(
      getEventBus().listen(ModelEvents.Deleted, async ({ payload }) => {
        if (payload.model.id === branch.id) {
          deleteEventFired = true
        }
      })
    )

    await deleteBranchAndNotify({ id: branch.id, streamId: stream.id }, user.id)
    const { items } = await getBranchesByStreamId(stream.id)
    expect(items).to.have.lengthOf(4)
    expect(deleteEventFired).to.be.true
  })

  it('Deleting a branch should delete the commit', async () => {
    const branchName = 'pasta'

    const branchId = (
      await createBranch({
        name: branchName,
        streamId: stream.id,
        authorId: user.id,
        description: null
      })
    ).id

    const { id: tempCommitId } = await createCommitByBranchName({
      streamId: stream.id,
      branchName,
      message: 'temp commit',
      sourceApplication: 'tests',
      objectId: testObject.id,
      authorId: user.id
    })
    await deleteBranchAndNotify({ id: branchId, streamId: stream.id }, user.id)

    const commit = await Commits().where({ id: tempCommitId }).first()
    expect(commit).to.be.undefined
  })

  it('Should NOT delete the main branch', async () => {
    const b = await getStreamBranchByName(stream.id, 'main')
    try {
      await deleteBranchAndNotify({ id: b!.id, streamId: stream.id }, user.id)
      assert.fail()
    } catch {
      // pass
    }
  })

  it('Should return branches in time createdAt order, MAIN first', async () => {
    const { items } = await getBranchesByStreamId(stream.id)

    expect(items[0].name).to.equal('main')
    expect(items[1].createdAt < items[2].createdAt).to.equal(true)
  })
})
