import { db } from '@/db/knex'
import { getRegisteredRegionClients } from '@/modules/multiregion/utils/dbSelector'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import type { Knex } from 'knex'

export async function getTestRegionClients(): Promise<[Knex, ...Knex[]]> {
  const regionClients = await getRegisteredRegionClients()
  const regionDbs = Object.values(regionClients)
  return isMultiRegionTestMode() ? [db, ...regionDbs] : [db]
}
