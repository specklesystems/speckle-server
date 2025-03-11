import { LimitedUserWithStreamRole } from '@/modules/core/domain/streams/types'
import {
  ObjectPreviewInput,
  ObjectPreviewRequest
} from '@/modules/previews/domain/operations'
import { createObjectPreviewFactory } from '@/modules/previews/services/createObjectPreview'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('object preview @previews', () => {
  describe('createObjectPreviewFactory creates a function, that', () => {
    it('requests and stores an object preview', async () => {
      const appToken = cryptoRandomString({ length: 40 })
      const streamOwner: LimitedUserWithStreamRole = {
        id: cryptoRandomString({ length: 10 }),
        avatar: null,
        bio: null,
        company: null,
        createdAt: new Date(),
        name: 'Preview User',
        role: Roles.Server.User,
        streamRole: Roles.Stream.Owner,
        verified: true
      }

      let userId: string | undefined = undefined
      let objectPreviewInput: ObjectPreviewInput | undefined = undefined
      const serverOrigin = 'https://example.org'
      let objectPreviewRequest: ObjectPreviewRequest | undefined = undefined
      const createObjectPreview = createObjectPreviewFactory({
        serverOrigin,
        getStreamCollaborators: async () => [streamOwner],
        createAppToken: async (tokenArgs) => {
          userId = tokenArgs.userId
          return appToken
        },
        storeObjectPreview: async (objectPreview) => {
          objectPreviewInput = objectPreview
        },
        requestObjectPreview: async (previewRequest) => {
          objectPreviewRequest = previewRequest
        }
      })
      const objectId = cryptoRandomString({ length: 32 })
      const streamId = cryptoRandomString({ length: 10 })
      const priority = 0
      await createObjectPreview({ objectId, streamId, priority })
      expect(objectPreviewInput).to.deep.equal({ objectId, streamId, priority })
      expect(userId).to.deep.equal(streamOwner.id)
      expect(objectPreviewRequest).to.deep.equal({
        url: `${serverOrigin}/projects/${streamId}/models/${objectId}`,
        jobId: `${streamId}.${objectId}`,
        token: appToken
      })
    })
  })
})
