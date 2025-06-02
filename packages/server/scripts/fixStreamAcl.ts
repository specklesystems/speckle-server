import {
  getAvailableRegionConfig,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import { getStringFromEnv } from '@/modules/shared/helpers/envHelper'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import knex from 'knex'
import { configureClient } from '@/knexfile'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import { UserEmail } from '@/modules/core/domain/userEmails/types'

const TARGET_WORKSPACE_ID = '725392a6d1'

const getSourceServerConnection = async () => {
  const sourceDbConnection = getStringFromEnv('SOURCE_DB_CONNECTION')
  const sourceDb = knex(sourceDbConnection)
  return { sourceDb }
}

const getTargetServerConnection = async (targetWorkspaceId: string) => {
  const targetMainDbConfig = await getMainRegionConfig()
  const targetMainDb = configureClient(targetMainDbConfig).public

  const workspace = await getWorkspaceFactory({ db: targetMainDb })({
    workspaceId: targetWorkspaceId
  })
  if (!workspace) throw Error('Target workspace not found')

  let targetRegionDb = targetMainDb

  const workspaceRegion = await getDefaultRegionFactory({ db: targetMainDb })({
    workspaceId: targetWorkspaceId
  })
  if (workspaceRegion) {
    const targetWorkspaceRegionConfig = (await getAvailableRegionConfig())[
      workspaceRegion.key
    ]
    targetRegionDb = configureClient(targetWorkspaceRegionConfig).public
  }

  return {
    targetMainDb,
    targetRegionDb,
    targetWorkspaceRegionKey: workspaceRegion?.key ?? null
  }
}

const userIdMapping: Record<string, string | null> = {}

const main = async () => {
  const { sourceDb } = await getSourceServerConnection()
  const { targetMainDb } = await getTargetServerConnection(TARGET_WORKSPACE_ID)
  for await (const userEmails of executeBatchedSelect(
    sourceDb.table<UserEmail>('user_emails').select('*')
  )) {
    for (const userEmail of userEmails) {
      const sourceUserId = userEmail.userId
      const targetUserEmail = await findEmailFactory({ db: targetMainDb })({
        email: user.email.toLowerCase(),
        verified: true
      })
      if (!targetUserEmail) throw new Error('Target user email not found')
      userIdMapping[sourceUserId] = targetUserEmail.userId
    }
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))
