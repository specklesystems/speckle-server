import type {
  GetAccSyncItemByUrn,
  UpsertAccSyncItem
} from '@/modules/acc/domain/operations'
import { logger } from '@/observability/logging'

type OnVersionAdded = (params: {
  fileLineageUrn: string
  fileVersionUrn: string
  fileVersionIndex: number
}) => Promise<void>

export const onVersionAddedFactory =
  (deps: {
    getAccSyncItemByUrn: GetAccSyncItemByUrn
    upsertAccSyncItem: UpsertAccSyncItem
  }): OnVersionAdded =>
  async ({ fileLineageUrn, fileVersionUrn, fileVersionIndex }) => {
    const syncItem = await deps.getAccSyncItemByUrn({ lineageUrn: fileLineageUrn })

    if (!syncItem) {
      logger.warn(
        { fileLineageUrn },
        'Received version added event for file with unknown lineage urn {lineageUrn}'
      )
      return
    }

    await deps.upsertAccSyncItem({
      ...syncItem,
      status: 'PENDING',
      accFileVersionIndex: fileVersionIndex,
      accFileVersionUrn: fileVersionUrn
    })
  }
