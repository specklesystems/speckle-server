import { db } from '@/db/knex'
import {
  getRegisteredRegionClients,
  isRegionMain
} from '@/modules/multiregion/utils/dbSelector'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import type { Knex } from 'knex'

export async function getTestRegionClients(): Promise<[Knex, ...Knex[]]> {
  if (!isMultiRegionTestMode()) return [db]

  const regionClients = await getRegisteredRegionClients()
  const regionDbs = Object.values(regionClients)
  return [db, ...regionDbs]
}

export async function getTestRegionClientsForProject({
  regionKey
}: {
  regionKey?: string
}): Promise<[Knex, ...Knex[]]> {
  if (!isMultiRegionTestMode()) return [db]

  if (!regionKey) return [db]
  const regionClients = await getRegisteredRegionClients()

  const regionDb = regionClients[regionKey]
  if (!regionDb) return [db]

  if (isRegionMain({ regionKey })) return [db]

  return [db, regionDb]
}
