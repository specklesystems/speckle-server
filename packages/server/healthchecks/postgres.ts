import type { Knex } from 'knex'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
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
  const clients = await getAllRegisteredDbClients()

  const results: Record<string, CheckResponse> = {}
  for (const dbClient of clients) {
    try {
      results[dbClient.regionKey] = await isPostgresAlive({ db: dbClient.client })
    } catch (err) {
      results[dbClient.regionKey] = {
        isAlive: false,
        err: ensureErrorOrWrapAsCause(err, 'Unknown postgres error.')
      }
    }
  }

  return results
}
