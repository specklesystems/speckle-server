import { getBlobs } from '@/modules/blobstorage/services'
import { keyBy } from 'lodash'

export = {
  SmartTextEditorValue: {
    async attachments(parent: { blobIds: string[] }) {
      const { blobIds } = parent
      if (!blobIds) return null

      const blobs = await getBlobs({ blobIds })
      const blobsById = keyBy(blobs, (b) => b.id)
      return blobIds.map((blobId) => blobsById[blobId] || null).filter((b) => !!b)
    }
  }
}
