// eslint-disable-next-line no-restricted-imports
import '../bootstrap.js'

import { configureClient } from '@/knexfile'
import { getObjectStorage } from '@/modules/blobstorage/clients/objectStorage.js'
import {
  getObjectStreamFactory,
  storeFileStreamFactory
} from '@/modules/blobstorage/repositories/blobs.js'
import {
  getBlobsFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories/index.js'
import {
  getBatchedStreamCommentsFactory,
  getCommentLinksFactory,
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import {
  getBatchedStreamBranchesFactory,
  insertBranchesFactory
} from '@/modules/core/repositories/branches'
import {
  getAllBranchCommitsFactory,
  insertBranchCommitsFactory,
  insertCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getBatchedStreamObjectsFactory,
  insertObjectsFactory
} from '@/modules/core/repositories/objects'
import {
  deleteProjectFactory,
  storeProjectFactory
} from '@/modules/core/repositories/projects'
import {
  getStreamCollaboratorsFactory,
  getStreamsFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUsersFactory } from '@/modules/core/repositories/users'
import {
  getAvailableRegionConfig,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import { getStringFromEnv } from '@/modules/shared/helpers/envHelper'
import {
  SavedViewGroups,
  SavedViews,
  storeSavedViewFactory,
  storeSavedViewGroupFactory
} from '@/modules/viewer/repositories/savedViews.js'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import {
  getWorkspaceFactory,
  getWorkspaceRolesFactory
} from '@/modules/workspaces/repositories/workspaces'
import { sleep } from '@/test/helpers.js'
import type { StreamRoles } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import knex from 'knex'
import { omit } from 'lodash-es'

// SOURCE
const projectIds = ['edbf5f099d']

// { 'sourceId' : 'targetId' }
const userIdMapping: Record<string, string> = {
  '52fb7b2818': 'ee07689e6c'
}
const userIds = Object.keys(userIdMapping)

// TARGET
const workspaceId = ''

const sourceStorage = getObjectStorage({
  credentials: {
    accessKeyId: getStringFromEnv('SOURCE_S3_ACCESS_KEY'),
    secretAccessKey: getStringFromEnv('SOURCE_S3_SECRET_KEY')
  },
  endpoint: getStringFromEnv('SOURCE_S3_ENDPOINT'),
  region: getStringFromEnv('SOURCE_S3_REGION'),
  bucket: getStringFromEnv('SOURCE_S3_BUCKET')
})
const sourceDbConnection = getStringFromEnv('SOURCE_DB_CONNECTION')
const sourceDb = knex(sourceDbConnection)

const main = async () => {
  const targetMainDbConfig = await getMainRegionConfig()

  // get mainDb and storage
  const mainDb = configureClient(targetMainDbConfig).public
  const mainStorage = getObjectStorage({
    credentials: {
      accessKeyId: targetMainDbConfig.blobStorage.accessKey,
      secretAccessKey: targetMainDbConfig.blobStorage.secretKey
    },
    endpoint: targetMainDbConfig.blobStorage.endpoint,
    region: targetMainDbConfig.blobStorage.s3Region,
    bucket: targetMainDbConfig.blobStorage.bucket
  })

  const workspace = await getWorkspaceFactory({ db: mainDb })({ workspaceId })
  if (!workspace) throw Error('Target workspace not found')

  let regionDb = mainDb
  let regionStorage = mainStorage
  const workspaceRegion = await getDefaultRegionFactory({ db: mainDb })({
    workspaceId
  })

  // in case of multiregion, we override the default targets
  if (workspaceRegion) {
    const targetWorkspaceRegionConfig = (await getAvailableRegionConfig())[
      workspaceRegion.key
    ]
    regionDb = configureClient(targetWorkspaceRegionConfig).public
    regionStorage = getObjectStorage({
      credentials: {
        accessKeyId: targetWorkspaceRegionConfig.blobStorage.accessKey,
        secretAccessKey: targetWorkspaceRegionConfig.blobStorage.secretKey
      },
      endpoint: targetWorkspaceRegionConfig.blobStorage.endpoint,
      region: targetWorkspaceRegionConfig.blobStorage.s3Region,
      bucket: targetWorkspaceRegionConfig.blobStorage.bucket
    })
  }

  // getting users here, to make sure they all exist
  const sourceUsers = await getUsersFactory({ db: sourceDb })(userIds)
  const sourceProjects = await getStreamsFactory({ db: sourceDb })(projectIds)
  const workspaceAcls = await getWorkspaceRolesFactory({ db: mainDb })({ workspaceId })

  console.log('Start with config', {
    totalProjects: sourceProjects.length,
    from: {
      db: sourceDbConnection,
      storage: sourceStorage.bucket
    },
    to: {
      main: mainDb.client.connection.host,
      region: regionDb.client.connection.host,
      storage: regionStorage.bucket
    }
  })
  await sleep(5000)

  for (const sourceProject of sourceProjects) {
    const project = {
      ...sourceProject,
      regionKey: workspaceRegion?.key || null,
      workspaceId
    }

    // as we do not have replication
    // projects must be written to mainDb only in case of multiregion

    const createProject = async () => {
      await storeProjectFactory({ db: regionDb })({ project })
      if (workspaceRegion) await storeProjectFactory({ db: mainDb })({ project })
    }

    const deleteProject = async () => {
      await deleteProjectFactory({ db: regionDb })({ projectId: sourceProject.id })
      if (workspaceRegion)
        await deleteProjectFactory({ db: mainDb })({ projectId: sourceProject.id })
    }

    try {
      await createProject()
    } catch (error) {
      await deleteProject()
      throw error
    }

    const regionTrx = await regionDb.transaction()
    const mainTrx = await mainDb.transaction()
    try {
      // stream meta not needed, currently it only holds info about the onboarding project
      // stream favorites is ignored

      // objects
      // the heavy stuff done in batches
      for await (const objectsBatch of getBatchedStreamObjectsFactory({ db: sourceDb })(
        sourceProject.id,
        { batchSize: 500 }
      )) {
        await insertObjectsFactory({ db: regionTrx })(objectsBatch)
      }

      // object previews are ignored, they will be regenerated when requested

      // branches
      const branchIds: string[] = []
      for await (const branchBatch of getBatchedStreamBranchesFactory({ db: sourceDb })(
        sourceProject.id
      )) {
        const branchesAuthorRemapped = branchBatch.map((b) => {
          branchIds.push(b.id)
          if (!b.authorId) return b
          if (!(b.authorId in userIdMapping)) throw new Error('Unknown branch author')
          return {
            ...b,
            authorId: userIdMapping[b.authorId]
          }
        })
        if (branchesAuthorRemapped.length)
          await insertBranchesFactory({ db: regionTrx })(branchesAuthorRemapped)
      }

      // commits
      const sc: { streamId: string; commitId: string }[] = []
      const bc: { branchId: string; commitId: string }[] = []

      const branchCommits = await getAllBranchCommitsFactory({ db: sourceDb })({
        projectId: sourceProject.id
      })
      for (const [branchId, commitBatch] of Object.entries(branchCommits)) {
        const commitsRemapped = commitBatch.map((c) => {
          sc.push({ streamId: sourceProject.id, commitId: c.id })
          bc.push({ branchId, commitId: c.id })
          if (!c.author) return omit(c, 'branchId')
          if (!(c.author in userIdMapping)) throw new Error('Unknown commit author')
          const commit = {
            ...c,
            author: userIdMapping[c.author]
          }

          // yeah, that is added by the repo function...
          const omited = omit(commit, 'branchId')
          return omited
        })
        if (commitsRemapped.length)
          await insertCommitsFactory({ db: regionTrx })(commitsRemapped)
      }

      // stream_commits
      await insertStreamCommitsFactory({ db: regionTrx })(sc)
      // branch_commits
      await insertBranchCommitsFactory({ db: regionTrx })(bc)

      // comments need userId mapping
      const commentIds: string[] = []
      for await (const commentBatch of getBatchedStreamCommentsFactory({
        db: sourceDb
      })(sourceProject.id)) {
        const commentsRemapped = commentBatch
          .map((c) => {
            if (!(c.authorId in userIdMapping))
              throw new Error('Comment author not found')
            if (c.text)
              return {
                ...c,
                authorId: userIdMapping[c.authorId]
              }
          })
          .filter((c) => c !== undefined)
        // TODO: this borks the createdAt date !!!!!
        // TODO: why is the text null in the return object?
        if (commentsRemapped.length)
          // @ts-expect-error comments are always text
          await insertCommentsFactory({ db: regionTrx })(commentsRemapped)
      }
      // comment views need userId mapping
      // skipping comment views for now, its not essential...

      // comment links
      if (commentIds.length) {
        const commentLinks = await getCommentLinksFactory({ db: sourceDb })(commentIds)
        await insertCommentLinksFactory({ db: regionTrx })(commentLinks)
      }

      // file uploads
      // skipping file uploads is none of that in the current source

      // skipping webhooks, there is not of that in the current source
      // webhooks_config
      // webhooks_events

      const existingStreamCollaborators = await getStreamCollaboratorsFactory({
        db: sourceDb
      })(sourceProject.id, undefined, { limit: 100 })

      for (const user of sourceUsers) {
        // stream_acl is calculated based on the users workspace role and the original role
        if (!(user.id in userIdMapping))
          throw new Error('cannot find source user in mapping')
        const userId = userIdMapping[user.id]
        let role: StreamRoles | null = null

        const existingCollaborator = existingStreamCollaborators.find(
          (c) => c.id === user.id
        )
        if (existingCollaborator) {
          role = existingCollaborator.streamRole
        }
        const workspaceAcl = workspaceAcls.find((w) => w.userId === userId)
        if (!workspaceAcl) throw new Error('User not member of the workspace')
        if (workspaceAcl.role === Roles.Workspace.Admin) {
          role = Roles.Stream.Owner
        }
        if (!role && workspaceAcl.role === Roles.Workspace.Member) {
          role = Roles.Stream.Contributor
        }

        // guest can be ignored, they get roles from the original project role
        if (role)
          await grantStreamPermissionsFactory({ db: mainTrx })({
            userId,
            streamId: sourceProject.id,
            role
          })
      }

      // helper functions to remap userIds
      const userInMapping = <T extends { userId: string | null }>(b: T) =>
        b.userId === null || b.userId in userIdMapping
      const remapUserId = <T extends { userId: string | null }>(b: T) => {
        if (!b.userId) return b

        return {
          ...b,
          userId: userIdMapping[b.userId]
        }
      }

      // blobs

      const projectBlobs = (
        await getBlobsFactory({ db: sourceDb })({ streamId: sourceProject.id })
      )
        .filter(userInMapping)
        .map(remapUserId)

      for (const blob of projectBlobs) {
        if (!blob.objectKey) continue

        const readable = await getObjectStreamFactory({ storage: sourceStorage })({
          objectKey: blob.objectKey
        })

        const { fileHash } = await storeFileStreamFactory({ storage: regionStorage })({
          objectKey: blob.objectKey,
          fileStream: readable
        })

        await upsertBlobFactory({ db: regionTrx })({ ...blob, fileHash })
      }

      // Saved views

      const savedViews = (
        await sourceDb(SavedViews.name)
          .select('*')
          .where(SavedViews.col.projectId, sourceProject.id)
      )
        .filter(userInMapping)
        .map(remapUserId)

      for (const savedView of savedViews) {
        await storeSavedViewFactory({ db: regionTrx })(savedView)
      }

      const savedViewGroups = (
        await sourceDb(SavedViewGroups.name)
          .select('*')
          .where(SavedViewGroups.col.projectId, sourceProject.id)
      )
        .filter(userInMapping)
        .map(remapUserId)

      for (const savedViewGroup of savedViewGroups) {
        await storeSavedViewGroupFactory({ db: regionTrx })(savedViewGroup)
      }

      // throw new Error('not ready to commit to this just yet')
      await mainTrx.commit()
      await regionTrx.commit()
      console.log(`Done: ${sourceProject.id}`)
    } catch (err) {
      await regionTrx.rollback()
      await mainTrx.commit()
      // cleanup the project from the DB
      await deleteProject()
      throw err
    }
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))
