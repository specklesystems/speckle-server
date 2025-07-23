import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { getLastVersionsByProjectIdFactory } from '@/modules/core/repositories/versions'
import { createTestUser } from '@/test/authHelper'
import type { BasicTestCommit } from '@/test/speckle-helpers/commitHelper'
import { createTestCommit } from '@/test/speckle-helpers/commitHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'

describe('Versions repositories @core', () => {
  describe('getLastVersionByProjectIdFactory returns a function that, ', () => {
    const getLastVersionsByProjectId = getLastVersionsByProjectIdFactory({ db })
    it('should return the last version for each projectId', async () => {
      const user = await createTestUser({
        name: createRandomString(),
        email: createRandomEmail()
      })

      const project1 = {
        id: '',
        name: createRandomString()
      }
      await createTestStream(project1, user)

      const version1 = {
        streamId: project1.id
      }
      await createTestCommit(version1 as BasicTestCommit, {
        owner: user
      })
      const version2 = {
        id: createRandomString(),
        streamId: project1.id
      }
      await createTestCommit(version2 as BasicTestCommit, {
        owner: user
      })

      const project2 = {
        id: '',
        name: createRandomString()
      }
      await createTestStream(project2, user)

      const version3 = {
        streamId: project2.id
      }
      await createTestCommit(version3 as BasicTestCommit, {
        owner: user
      })
      const version4 = {
        streamId: project2.id
      }
      await createTestCommit(version4 as BasicTestCommit, {
        owner: user
      })

      const result = await getLastVersionsByProjectId({
        projectIds: [project1.id, project2.id]
      })
      const lastVersionProject1 = result[project1.id]
      const lastVersionProject2 = result[project2.id]
      expect(lastVersionProject1[0].projectId).to.eq(project1.id)
      expect(lastVersionProject2[0].projectId).to.eq(project2.id)
    })
  })
})
