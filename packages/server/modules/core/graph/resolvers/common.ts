import { mainDb } from '@/db/knex'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'
import { isNonNullable } from '@speckle/shared'
import { keyBy } from 'lodash'

export = {
  SmartTextEditorValue: {
    async attachments(parent) {
      const { blobIds, projectId } = parent
      if (!blobIds) return null

      const db = projectId ? await getProjectDbClient({ projectId }) : mainDb
      const blobs = await getBlobsFactory({ db })({ blobIds })

      const blobsById = keyBy(blobs, (b) => b.id)
      return blobIds.map((blobId) => blobsById[blobId] || null).filter(isNonNullable)
    }
  }
} as Resolvers
