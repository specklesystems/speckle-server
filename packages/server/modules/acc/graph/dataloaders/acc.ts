import { getFolderContents } from '@/modules/acc/clients/autodesk/acc'
import type {
  AccSyncItem,
  DataManagementFolderContentsFolder,
  DataManagementFolderContentsItem
} from '@/modules/acc/domain/acc/types'
import {
  getAccSyncItemsByIdFactory,
  getAccSyncItemsByModelIdFactory
} from '@/modules/acc/repositories/accSyncItems'
import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import type { Nullable } from '@speckle/shared'
import { keyBy } from 'lodash-es'

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders
    extends Partial<ReturnType<typeof dataLoadersDefinition>> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ createLoader, deps: { db } }) => {
    const getAccSyncItemsById = getAccSyncItemsByIdFactory({ db })
    const getAccSyncItemsByModelId = getAccSyncItemsByModelIdFactory({ db })

    return {
      acc: {
        getFolderChildren: createLoader<
          { projectId: string; folderId: string; token: string },
          DataManagementFolderContentsFolder[],
          string
        >(
          async (folderIds) => {
            return await Promise.all(
              folderIds.map(async ({ projectId, folderId, token }) => {
                const items = await getFolderContents(
                  { projectId, folderId, type: 'folders' },
                  { token }
                )
                return items.filter(
                  (item): item is DataManagementFolderContentsFolder =>
                    item.type === 'folders'
                )
              })
            )
          },
          {
            cacheKeyFn: (args) => `${args.projectId}-${args.projectId}`
          }
        ),
        getFolderContents: createLoader<
          { projectId: string; folderId: string; token: string },
          DataManagementFolderContentsItem[],
          string
        >(
          async (folderIds) => {
            return await Promise.all(
              folderIds.map(async ({ projectId, folderId, token }) => {
                const items = await getFolderContents(
                  { projectId, folderId, type: 'items' },
                  { token }
                )
                return items.filter(
                  (item): item is DataManagementFolderContentsItem =>
                    item.type === 'items'
                )
              })
            )
          },
          {
            cacheKeyFn: (args) => `${args.projectId}-${args.projectId}`
          }
        ),
        getAccSyncItem: createLoader<string, Nullable<AccSyncItem>>(async (ids) => {
          const results = keyBy(
            await getAccSyncItemsById({ ids: ids.slice() }),
            (i) => i.id
          )
          return ids.map((i) => results[i] || null)
        }),
        getAccSyncItemByModelId: createLoader<string, Nullable<AccSyncItem>>(
          async (ids) => {
            const results = keyBy(
              await getAccSyncItemsByModelId({ ids: ids.slice() }),
              (i) => i.modelId
            )
            return ids.map((i) => results[i] || null)
          }
        )
      }
    }
  }
)

export default dataLoadersDefinition
