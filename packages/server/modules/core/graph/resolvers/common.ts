import { getBlobs } from '@/modules/blobstorage/services'
import { keyBy } from 'lodash'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

export = {
  SmartTextEditorValue: {
    async attachments(parent) {
      const { blobIds } = parent
      if (!blobIds) return null

      const blobs = await getBlobs({ blobIds })
      const blobsById = keyBy(blobs, (b) => b.id)
      return blobIds.map((blobId) => blobsById[blobId] || null).filter((b) => !!b)
    }
  }
} as Resolvers
