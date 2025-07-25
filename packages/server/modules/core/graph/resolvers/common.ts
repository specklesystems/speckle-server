import { mainDb } from '@/db/knex'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { NotImplementedError } from '@/modules/shared/errors'
import { isNonNullable } from '@speckle/shared'
import { keyBy } from 'lodash-es'

export default {
  SmartTextEditorValue: {
    async attachments(parent) {
      const { blobIds, projectId } = parent
      if (!blobIds) return null

      const db = projectId ? await getProjectDbClient({ projectId }) : mainDb
      const blobs = await getBlobsFactory({ db })({ blobIds })

      const blobsById = keyBy(blobs, (b) => b.id)
      return blobIds.map((blobId) => blobsById[blobId] || null).filter(isNonNullable)
    }
  },
  Price: {
    currencySymbol(parent) {
      switch (parent.currency) {
        case 'usd':
          return '$'
        case 'eur':
          return '€'
        case 'gbp':
          return '£'
        default:
          throw new NotImplementedError(
            `Currency symbol for ${parent.currency} not implemented`
          )
      }
    }
  }
} as Resolvers
