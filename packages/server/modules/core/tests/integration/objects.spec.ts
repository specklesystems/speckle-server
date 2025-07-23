import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import { getStreamObjectCountFactory } from '@/modules/core/repositories/objects'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import type { BasicTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestBranch } from '@/test/speckle-helpers/branchHelper'
import type { BasicTestCommit } from '@/test/speckle-helpers/commitHelper'
import { createTestCommit, createTestObject } from '@/test/speckle-helpers/commitHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import cryptoRandomString from 'crypto-random-string'
import { db } from '@/db/knex'
import { expect } from 'chai'

const getStreamObjectCount = getStreamObjectCountFactory({ db })

describe('Object repository functions', () => {
  const adminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: createRandomEmail()
  }

  const testProject: BasicTestStream = {
    id: '',
    ownerId: '',
    name: 'Test Project',
    isPublic: true
  }

  const testModel: BasicTestBranch = {
    id: '',
    name: cryptoRandomString({ length: 8 }),
    streamId: '',
    authorId: ''
  }

  const testVersion: BasicTestCommit = {
    id: '',
    objectId: '',
    streamId: '',
    authorId: '',
    branchId: ''
  }

  before(async () => {
    await createTestUser(adminUser)
  })

  beforeEach(async () => {
    await createTestStream(testProject, adminUser)
    await createTestBranch({
      stream: testProject,
      branch: testModel,
      owner: adminUser
    })

    testVersion.branchId = ''
    testVersion.branchName = testModel.name
    testVersion.objectId = await createTestObject({ projectId: testProject.id })

    await createTestCommit(testVersion, {
      owner: adminUser,
      stream: testProject
    })
  })

  describe('getStreamObjectCountFactory creates a function, that', () => {
    it('correctly counts the number of objects in a project', async () => {
      const count = await getStreamObjectCount({ streamId: testProject.id })
      expect(count).to.equal(1)
    })

    it('returns 0 if the project does not exist', async () => {
      const count = await getStreamObjectCount({
        streamId: cryptoRandomString({ length: 9 })
      })
      expect(count).to.equal(0)
    })
  })
})
