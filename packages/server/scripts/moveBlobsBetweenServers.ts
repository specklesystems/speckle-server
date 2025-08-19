// eslint-disable-next-line no-restricted-imports
import '../bootstrap'

import { configureClient } from '@/knexfile'
import { getObjectStorage } from '@/modules/blobstorage/clients/objectStorage'
import { getBlobsFactory, upsertBlobFactory } from '@/modules/blobstorage/repositories'
import {
  getObjectStreamFactory,
  storeFileStreamFactory
} from '@/modules/blobstorage/repositories/blobs'
import {
  getAvailableRegionConfig,
  getMainRegionConfig
} from '@/modules/multiregion/regionConfig'
import { getStringFromEnv } from '@/modules/shared/helpers/envHelper'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import knex from 'knex'

const userIdMapping: Record<string, string> = {
  e7befdebd7: '9c47ba34ba',
  d51ebc7251: '516a56bb5c'
}

const workspaceId = '37b7f31df2'

// TODO: configure this
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
  // get mainDb
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
  // from sourceDb -> to mainDb (regionDb in case there it's configured like that)
  const workspaceRegion = await getDefaultRegionFactory({ db: mainDb })({
    workspaceId
  })

  if (workspaceRegion) {
    const targetWorkspaceRegionConfig = (await getAvailableRegionConfig())[
      workspaceRegion.key
    ] // here: target blob storage config (regional)
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

  // starting first trx here
  const regionTrx = await regionDb.transaction()
  const mainTrx = await mainDb.transaction()

  try {
    const projectBlobs = (await getBlobsFactory({ db: sourceDb })({})).filter(
      (b) => b.userId === null || b.userId in userIdMapping
    )
    const remappedProjectBlobs = projectBlobs.map((b) => {
      if (!b.userId) return b

      return {
        ...b,
        userId: userIdMapping[b.userId]
      }
    })

    for (const b of remappedProjectBlobs) {
      if (!b.objectKey) continue

      const readable = await getObjectStreamFactory({ storage: sourceStorage })({
        objectKey: b.objectKey
      })

      const { fileHash } = await storeFileStreamFactory({ storage: regionStorage })({
        objectKey: b.objectKey,
        fileStream: readable
      })

      console.log('moved', {
        name: b.fileName,
        key: b.objectKey,
        hash: b.fileHash,
        resultHash: fileHash
      })

      await upsertBlobFactory({ db: regionTrx })({
        ...b,
        fileHash
      })
    }

    // throw new Error('not ready to commit to this just yet')
    await mainTrx.commit()
    await regionTrx.commit()
  } catch (err) {
    await regionTrx.rollback()
    await mainTrx.commit()
    // cleanup the project from the DB
    // await deleteProjectFactory({ db: regionDb })({ projectId: sourceProject.id })
    throw err
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.log(e))
