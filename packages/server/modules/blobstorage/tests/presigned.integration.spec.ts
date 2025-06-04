import { generatePresignedUrlFactory } from '@/modules/blobstorage/services/presigned'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  getSignedUrl,
  ObjectStorage
} from '@/modules/blobstorage/clients/objectStorage'
import {
  getBlobMetadataFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { Roles } from '@speckle/shared'
import { createProject } from '@/test/projectHelper'
import { createTestUser } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import { Knex } from 'knex'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'

describe('Presigned integration @blobstorage', async () => {
  const serverAdmin = { id: '', name: 'server admin', role: Roles.Server.Admin }
  const ownedProject = {
    id: '',
    name: 'owned stream',
    isPublic: false
  }

  let projectDb: Knex
  let projectStorage: ObjectStorage
  let getBlobMetadata: ReturnType<typeof getBlobMetadataFactory>
  let SUT: ReturnType<typeof generatePresignedUrlFactory>

  before(async () => {
    await beforeEachContext()
    serverAdmin.id = (await createTestUser(serverAdmin)).id
    ownedProject.id = (
      await createProject({
        ...ownedProject,
        ownerId: serverAdmin.id
      })
    ).id
    ;[projectDb, projectStorage] = await Promise.all([
      getProjectDbClient({ projectId: ownedProject.id }),
      getProjectObjectStorage({ projectId: ownedProject.id })
    ])
    getBlobMetadata = getBlobMetadataFactory({ db: projectDb })
    SUT = generatePresignedUrlFactory({
      objectStorage: projectStorage,
      getSignedUrl,
      upsertBlob: upsertBlobFactory({
        db: projectDb
      })
    })
  })

  describe('generate a presigned URL', () => {
    it('should provision a blob with uploadStatus 0 and return a presigned URL', async () => {
      const blobId = cryptoRandomString({ length: 10 })
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 20
      const url = await SUT({
        blobId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      expect(url).to.contain(`/assets/${ownedProject.id}/${blobId}?`)
      expect(url).to.contain(`X-Amz-Expires=${expiryDuration}`)
      expect(url).to.contain('X-Amz-Credential') // we don't need to check the whole url, we can trust S3; only that it appears to be signed

      const storedBlob = await getBlobMetadata({ blobId, streamId: ownedProject.id })
      expect(storedBlob).to.exist
      expect(storedBlob.id).to.equal(blobId)
      expect(storedBlob.uploadStatus).to.equal(0)
      expect(storedBlob.fileName).to.equal(fileName)
      expect(storedBlob.streamId).to.equal(ownedProject.id)
      expect(storedBlob.fileType).to.equal('stl')
    })
  })
})
