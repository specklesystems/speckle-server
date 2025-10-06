import { AccSyncItemStatuses } from '@/modules/acc/domain/acc/constants'
import type {
  QueryAllAccSyncItems,
  UpsertAccSyncItem
} from '@/modules/acc/domain/acc/operations'
import { logger } from '@/observability/logging'

type OnVersionAdded = (params: {
  fileLineageUrn: string
  fileVersionUrn: string
  fileVersionIndex: number
}) => Promise<void>

export const onVersionAddedFactory =
  (deps: {
    queryAllAccSyncItems: QueryAllAccSyncItems
    upsertAccSyncItem: UpsertAccSyncItem
  }): OnVersionAdded =>
  async ({ fileLineageUrn, fileVersionUrn, fileVersionIndex }) => {
    for await (const syncItems of deps.queryAllAccSyncItems({
      filter: { lineageUrn: fileLineageUrn }
    })) {
      for (const syncItem of syncItems) {
        if (syncItem.accFileVersionIndex > fileVersionIndex) {
          logger.warn(
            {
              syncItemId: syncItem.id,
              currentVersion: syncItem.accFileVersionIndex,
              incomingVersion: fileVersionIndex,
              incomingAccFile: {
                fileLineageUrn,
                fileVersionUrn,
                fileVersionIndex
              }
            },
            'Received event for superseded version of sync item {syncItemId} - Current: {currentVersion} Incoming: {incomingVersion}'
          )
          continue
        }

        await deps.upsertAccSyncItem({
          ...syncItem,
          status: AccSyncItemStatuses.pending,
          accFileVersionIndex: fileVersionIndex,
          accFileVersionUrn: fileVersionUrn
        })
      }
    }
  }
