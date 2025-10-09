import { expect } from 'chai'
import {
  createBranchAndNotifyFactory,
  updateBranchAndNotifyFactory
} from '@/modules/core/services/branch/management'
import cryptoRandomString from 'crypto-random-string'

describe('Branches @core-branches', () => {
  describe('createBranchAndNotifyFactory creates a function, that', () => {
    it('sanitizes user input', async () => {
      const SUT = createBranchAndNotifyFactory({
        getStreamBranchByName: async () => null,
        createBranch: async (input) => {
          expect(input.description).to.eq('A safe description')
          expect(input.name).to.equal('A safe name')
          return {
            id: 'branchId',
            ...input,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        eventEmit: async () => {}
      })

      await SUT(
        {
          name: '<script>alert("xss")</script>A safe name',
          description: '<script>alert("xss")</script>A safe description',
          streamId: cryptoRandomString({ length: 10 })
        },
        cryptoRandomString({ length: 10 })
      )
    })
  })
  describe('updateBranchAndNotifyFactory creates a function, that', () => {
    it('sanitizes user input', async () => {
      const modelId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })
      const authorId = cryptoRandomString({ length: 10 })
      const SUT = updateBranchAndNotifyFactory({
        getBranchById: async () => ({
          id: modelId,
          name: 'Old name',
          description: 'Old description',
          streamId: projectId,
          createdAt: new Date(),
          updatedAt: new Date(),
          authorId
        }),
        updateBranch: async (id, input) => {
          expect(id).to.eq(modelId)
          expect(input.name).to.equal('A safe name')
          expect(input.description).to.eq('A safe description')
          return {
            ...input,
            id: modelId,
            streamId: projectId,
            authorId,
            name: input.name!,
            description: input.description!,
            createdAt: input.createdAt || new Date(),
            updatedAt: input.updatedAt || new Date()
          }
        },
        eventEmit: async () => {}
      })

      await SUT(
        {
          name: '<script>alert("xss")</script>A safe name',
          description: '<script>alert("xss")</script>A safe description',
          id: modelId,
          streamId: projectId
        },
        authorId
      )
    })
  })
})
