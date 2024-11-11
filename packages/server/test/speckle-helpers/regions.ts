import { db } from '@/db/knex'
import { Regions } from '@/modules/multiregion/repositories'
import { getRegionKeys } from '@/test/hooks'

/**
 * Delete all regions entries that are not part of the main multi region mode
 */
export const truncateRegionsSafely = async () => {
  const regionKeys = getRegionKeys()
  await db(Regions.name).whereNotIn(Regions.col.key, regionKeys).delete()
}
