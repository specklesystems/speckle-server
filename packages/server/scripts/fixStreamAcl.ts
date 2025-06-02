// eslint-disable-next-line no-restricted-imports
import '../bootstrap'

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
import { findEmailFactory } from '@/modules/core/repositories/userEmails'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { getProjectFactory } from '@/modules/core/repositories/projects'

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

const userIdMapping: Record<string, string> = {}

const main = async () => {
  const { sourceDb } = await getSourceServerConnection()
  const { targetMainDb } = await getTargetServerConnection(TARGET_WORKSPACE_ID)
  console.log('remapping users from old userId to new')
  for await (const userEmails of executeBatchedSelect(
    sourceDb.table<UserEmail>('user_emails').select('*')
  )) {
    for (const userEmail of userEmails) {
      const sourceUserId = userEmail.userId
      const targetEmail = await findEmailFactory({ db: targetMainDb })({
        email: userEmail.email.toLowerCase(),
        verified: true
      })
      if (!targetEmail) {
        console.log(`Source user email ${userEmail.email} not found in target server`)
        continue
      }
      userIdMapping[sourceUserId] = targetEmail.userId
    }
  }

  let count = 0

  for await (const sourceProjects of executeBatchedSelect(
    sourceDb.table<StreamRecord>('streams').select('*')
  )) {
    for (const sourceProject of sourceProjects) {
      count++
      console.log(`${count}/x Migrating project acl for ${sourceProject.name}`)
      const targetProject = await getProjectFactory({ db: targetMainDb })({
        projectId: sourceProject.id
      })
      if (!targetProject)
        throw new Error(
          `target project ${sourceProject.name} not found in target server`
        )
      if (!(targetProject.workspaceId === TARGET_WORKSPACE_ID)) {
        throw new Error(`target project is not in the target workspace`)
      }

      console.log(`   target project found and is in the right workspace`)

      const streamAcl = await sourceDb
        .table<StreamAclRecord>('stream_acl')
        .where({ resourceId: sourceProject.id })
        .select('*')

      const newAcl = streamAcl.flatMap((acl) => {
        const newItem = { ...acl }
        if (!(acl.userId in userIdMapping)) return []
        const newId = userIdMapping[acl.userId]
        newItem.userId = newId
        return newItem
      })

      console.log(
        `   remapped stream_acls ignored ${streamAcl.length - newAcl.length}/${
          newAcl.length
        }`
      )

      const deleted = await targetMainDb
        .table<StreamAclRecord>('stream_acl')
        .delete('*')
        .where({ resourceId: targetProject.id })

      console.log(`   deleted ${deleted.length} old acl records`)

      if (!newAcl.length) {
        console.log(`   no new acl records to insert`)
        continue
      }
      await targetMainDb.table<StreamAclRecord>('stream_acl').insert(newAcl)

      console.log(`   inserted ${newAcl.length} new acl records`)
    }
  }

  // for stream in source server streams:
  // 1. get all stream_acl-s from source DB
  // 2. remap each stream_acl record with the new target user id
  //    if new target user id not found, ignore.
  // 3. find project by id from target db, to make sure it exists
  //    also verify that new target project is in the target workspace
  // 4. delete all stream_acl redords from target db, that belongs to this project
  // 5. insert the remapped acl records with the original roles
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))
