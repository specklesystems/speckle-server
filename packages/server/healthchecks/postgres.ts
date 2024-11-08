import type { Knex } from 'knex'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getDb, getRegisteredRegionClients } from '@/modules/multiregion/dbSelector'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import type { CheckResponse, MultiDBCheck } from '@/healthchecks/types'
import { ensureErrorOrWrapAsCause } from '@/modules/shared/errors/ensureError'

type DBCheck = (params: { db: Knex }) => Promise<CheckResponse>

export const isPostgresAlive: DBCheck = async (params) => {
  const { db } = params
  const getServerInfo = getServerInfoFactory({ db })

  try {
    await getServerInfo()
  } catch (err) {
    return { isAlive: false, err }
  }
  return { isAlive: true }
}

export const areAllPostgresAlive: MultiDBCheck = async (): Promise<
  Record<string, CheckResponse>
> => {
  let clients: Record<string, Knex> = {}
  clients['main'] = await getDb({ regionKey: null })
  if (isMultiRegionEnabled()) {
    const regionClients = await getRegisteredRegionClients()
    clients = { ...clients, ...regionClients }
  }

  const results: Record<string, CheckResponse> = {}
  for (const [key, dbClient] of Object.entries(clients)) {
    try {
      results[key] = await isPostgresAlive({ db: dbClient })
    } catch (err) {
      results[key] = {
        isAlive: false,
        err: ensureErrorOrWrapAsCause(err, 'Unknown postgres error.')
      }
    }
  }

  return results
}
