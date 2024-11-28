import { db } from '@/db/knex'
import { getUserFactory } from '@/modules/core/repositories/users'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { Regions } from '@/modules/multiregion/repositories'
import {
  isTestEnv,
  shouldRunTestsInMultiregionMode
} from '@/modules/shared/helpers/envHelper'
import {
  getRegionKeys,
  getMainTestRegionClient,
  getMainTestRegionKey
} from '@/test/hooks'
import { wait } from '@speckle/shared'

/**
 * Delete all regions entries that are not part of the main multi region mode
 */
export const truncateRegionsSafely = async () => {
  const regionKeys = getRegionKeys()
  await db(Regions.name).whereNotIn(Regions.col.key, regionKeys).delete()
}

export const isMultiRegionTestMode = () =>
  isMultiRegionEnabled() && isTestEnv() && shouldRunTestsInMultiregionMode()

const waitForPredicate = async (params: {
  predicate: () => Promise<boolean>
  timeout?: number
  delay?: number
  errMsg?: string
}) => {
  const { predicate, timeout = 5000, delay = 100, errMsg } = params
  const start = Date.now()

  while (Date.now() - start < timeout) {
    if (await predicate()) return
    await wait(delay)
  }

  throw new Error(errMsg || 'Timeout waiting for predicate')
}

/**
 * Wait for user to exist in region db
 */
export const waitForRegionUser = async (params: { userId: string }) => {
  const client = getMainTestRegionClient()
  const getUser = getUserFactory({ db: client })

  await waitForPredicate({
    predicate: async () => {
      const user = await getUser(params.userId)
      return !!user
    },
    errMsg: `User ${params.userId} not found in region db`
  })
}

export { getMainTestRegionClient, getMainTestRegionKey }
