import DataLoader from 'dataloader'
import { AuthContext } from '@/modules/shared/authz'
import { graphDataloadersBuilders } from '@/modules'
import { ModularizedDataLoadersConstraint } from '@/modules/shared/helpers/graphqlHelper'
import { Knex } from 'knex'
import { isNonNullable, Optional } from '@speckle/shared'
import { flatten, noop } from 'lodash'
import { db } from '@/db/knex'

/**
 * Lets not waste memory on loaders that may not actually be invoked
 */
const makeLazyDataLoader = <K, V, C = K>(
  ...args: ConstructorParameters<typeof DataLoader<K, V, C>>
): DataLoader<K, V, C> => {
  let dataloader: Optional<DataLoader<K, V, C>> = undefined

  return new Proxy({} as DataLoader<K, V, C>, {
    get(_target, prop) {
      if (!dataloader) {
        // If invoking clearAll() - we don't really need to do anything, no loader exists
        if (prop === 'clearAll') {
          return noop
        }

        dataloader = new DataLoader<K, V, C>(...args)
      }

      return dataloader[prop as keyof DataLoader<K, V, C>]
    }
  })
}

const makeSelfClearingDataloader = <K, V, C = K>(
  ...args: ConstructorParameters<typeof DataLoader<K, V, C>>
) => {
  const [batchLoadFn, options] = args

  const dataloader = makeLazyDataLoader<K, V, C>((ids) => {
    dataloader.clearAll()
    return batchLoadFn(ids)
  }, options)
  return dataloader
}

const buildDataLoaderCreator = (selfClearing = false) => {
  return <K, V, C = K>(...args: ConstructorParameters<typeof DataLoader<K, V, C>>) => {
    const [batchLoadFn, options] = args

    if (selfClearing) {
      return makeSelfClearingDataloader<K, V, C>(batchLoadFn, {
        ...(options || {}),
        cacheMap: null,
        cache: false
      })
    } else {
      return makeLazyDataLoader(batchLoadFn, options)
    }
  }
}

/**
 * Build request-scoped dataloaders
 * @param ctx GraphQL context w/o loaders
 */
export async function buildRequestLoaders(
  ctx: AuthContext,
  options?: Partial<{ cleanLoadersEarly: boolean }>
) {
  const createLoader = buildDataLoaderCreator(options?.cleanLoadersEarly || false)
  const modulesLoaders = graphDataloadersBuilders()

  const mainDb = db

  /**
   * Dataloaders autoloaded from various speckle modules, created for the specified region DB
   */
  const createLoadersForRegion = (deps: { db: Knex }) => {
    return {
      ...(Object.assign(
        {},
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        ...modulesLoaders.map((l) => l({ ctx, createLoader, deps }))
      ) as Record<string, unknown>)
    } as ModularizedDataLoaders
  }

  const mainDbLoaders = createLoadersForRegion({ db: mainDb })
  const regionLoaders = new Map<Knex, ModularizedDataLoaders>()

  // Extra utilities to add on top:

  /**
   * Get dataloaders for specific region
   */
  const forRegion = (deps: { db: Knex }) => {
    if (deps.db === mainDb) {
      return mainDbLoaders
    }

    if (!regionLoaders.has(deps.db)) {
      regionLoaders.set(deps.db, createLoadersForRegion(deps))
    }
    return regionLoaders.get(deps.db) as ModularizedDataLoaders
  }

  /**
   * Clear all request loaders across all regions
   */
  const clearAll = () => {
    const allLoaderGroups = flatten(
      [mainDbLoaders, ...regionLoaders.values()].map((l) =>
        Object.values(l || {}).filter(isNonNullable)
      )
    )

    for (const groupedLoaders of allLoaderGroups) {
      for (const loaderItem of Object.values(groupedLoaders)) {
        loaderItem.clearAll()
      }
    }
  }

  return {
    ...mainDbLoaders,
    clearAll,
    forRegion
  }
}

export interface ModularizedDataLoaders extends ModularizedDataLoadersConstraint {}

export type RequestDataLoaders = Awaited<ReturnType<typeof buildRequestLoaders>>
