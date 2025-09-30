import type { Stream } from '@/modules/core/domain/streams/types'
import { ProjectNotFoundError } from '@/modules/core/errors/projects'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import type {
  AsyncRegionKeyStore,
  CachedRegionKeyDelete,
  CachedRegionKeyLookup,
  RegionKeyLookupResult,
  StorageRegionKeyLookup,
  StorageRegionKeyUpdate,
  SyncRegionKeyLookup,
  SyncRegionKeyStore
} from '@/modules/multiregion/domain/operations'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import type { Knex } from 'knex'

export type GetProjectRegionKey = (args: {
  projectId: string
}) => Promise<RegionKeyLookupResult>

export const getProjectRegionKeyFactory =
  ({
    getRegionKeyFromMemory,
    writeRegionToMemory,
    getRegionKeyFromCache,
    writeRegionKeyToCache,
    getRegionKeyFromStorage
  }: {
    getRegionKeyFromMemory: SyncRegionKeyLookup
    writeRegionToMemory: SyncRegionKeyStore
    getRegionKeyFromCache: CachedRegionKeyLookup
    writeRegionKeyToCache: AsyncRegionKeyStore
    getRegionKeyFromStorage: StorageRegionKeyLookup
  }): GetProjectRegionKey =>
  async ({ projectId }) => {
    let regionKey = getRegionKeyFromMemory({ projectId })
    // if undefined, cache missed
    if (regionKey !== undefined) return regionKey

    regionKey = await getRegionKeyFromCache({ projectId })
    // if undefined, cache missed
    if (regionKey !== undefined) {
      writeRegionToMemory({ projectId, regionKey })
      return regionKey
    }

    // if this returns null, means we're in the default region
    regionKey = await getRegionKeyFromStorage({ projectId })
    if (regionKey === undefined) throw new StreamNotFoundError()
    writeRegionToMemory({ projectId, regionKey })
    await writeRegionKeyToCache({ projectId, regionKey })
    return regionKey
  }

export type UpdateProjectRegionKey = (args: {
  projectId: string
  regionKey: string
}) => Promise<Stream>

export const updateProjectRegionKeyFactory =
  (deps: {
    upsertProjectRegionKey: StorageRegionKeyUpdate
    cacheDeleteRegionKey: CachedRegionKeyDelete
    writeRegionToMemory: SyncRegionKeyStore
    emitEvent: EventBusEmit
  }): UpdateProjectRegionKey =>
  async ({ projectId, regionKey }) => {
    const project = await deps.upsertProjectRegionKey({
      projectId,
      regionKey
    })

    if (!project) {
      throw new ProjectNotFoundError()
    }

    // TODO: Immediately set to new region?
    await deps.cacheDeleteRegionKey({ projectId })
    deps.writeRegionToMemory({ projectId, regionKey })

    await deps.emitEvent({
      eventName: 'multiregion.project-region-updated',
      payload: {
        projectId,
        regionKey
      }
    })

    return project
  }

export type GetRegionDb = (args: { regionKey: string }) => Promise<Knex>
export type GetProjectDb<T extends Knex | undefined = Knex> = (args: {
  projectId: string
}) => T | Promise<T>
export const getProjectDbClientFactory =
  <T extends Knex | undefined>({
    getProjectRegionKey,
    getDefaultDb,
    getRegionDb
  }: {
    getProjectRegionKey: GetProjectRegionKey
    getDefaultDb: () => T
    getRegionDb: GetRegionDb
  }): GetProjectDb<T> =>
  async ({ projectId }) => {
    const regionKey = await getProjectRegionKey({ projectId })
    if (!regionKey) return getDefaultDb()
    return getRegionDb({ regionKey }) as Promise<T>
  }
