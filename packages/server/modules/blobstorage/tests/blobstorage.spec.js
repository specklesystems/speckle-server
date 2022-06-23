const expect = require('chai').expect
const { beforeEachContext } = require('@/test/hooks')
const {
  uploadFileStream,
  getBlobMetadata,
  getBlobMetadataCollection,
  cursorFromRows,
  decodeCursor,
  blobCollectionSummary,
  getFileStream,
  deleteBlob,
  markUploadOverFileSizeLimit,
  markUploadSuccess
} = require('@/modules/blobstorage/services')
const {
  NotFoundError,
  ResourceMismatch,
  BadRequestError
} = require('@/modules/shared/errors')
const { range } = require('lodash')
const { fakeIdGenerator, createBlobs } = require('@/modules/blobstorage/tests/helpers')

const fakeFileStreamStore = (fakeHash) => async () => ({ fileHash: fakeHash })

describe('Blob storage @blobstorage', () => {
  before(async () => {
    await beforeEachContext()
  })

  describe('Upload file stream', () => {
    const data = [
      [
        'blob',
        { streamId: 'a'.padStart(10, 'a'), userId: 'a'.padStart(10, 'b') },
        { blobId: 'a'.padStart(1, 'c') }
      ],
      [
        'stream',
        { streamId: 'a'.padStart(1, 'a'), userId: 'a'.padStart(10, 'b') },
        { blobId: 'a'.padStart(10, 'c') }
      ],
      [
        'user',
        { streamId: 'a'.padStart(10, 'a'), userId: 'a'.padStart(1, 'b') },
        { blobId: 'a'.padStart(10, 'c') }
      ]
    ]

    data.map(([caseName, streamData, blobData]) =>
      it(`Should throw if ${caseName} id length is incorrect`, async () => {
        try {
          await uploadFileStream(null, streamData, blobData)
        } catch (err) {
          if (!(err instanceof BadRequestError)) throw err
          expect(err.message).to.equal(`The ${caseName} id has to be of length 10`)
        }
      })
    )
    it('Should store file stream', async () => {
      const fileName = `testFile_${fakeIdGenerator()}`
      const streamId = fakeIdGenerator()
      const blobId = fakeIdGenerator()
      const userId = fakeIdGenerator()
      const fileHash = fakeIdGenerator()

      const blobData = await uploadFileStream(
        fakeFileStreamStore(fileHash),
        { streamId, userId },
        { blobId, fileName, fileType: '.something', fileStream: null }
      )
      expect(blobData).to.deep.equal({ blobId, fileName, fileHash })
    })
  })

  describe('Get blob metadata', () => {
    it('when no blob found throws NotFoundError', async () => {
      try {
        await getBlobMetadata({ streamId: 'foo', blobId: 'bar' })
        throw new Error('This should have failed')
      } catch (err) {
        if (!(err instanceof NotFoundError)) throw err
      }
    })
    it('when no streamId throws ResourceMismatch', async () => {
      try {
        const fakeBlobLookup = () => ({ first: async () => ({ a: 'random blob' }) })
        await getBlobMetadata({ streamId: null, blobId: 'bar' }, fakeBlobLookup)
        throw new Error('This should have failed')
      } catch (err) {
        if (!(err instanceof BadRequestError)) throw err
      }
    })
    it('when streamIds are not matching throws ResourceMismatch', async () => {
      try {
        const fakeBlobLookup = () => ({
          first: async () => ({ streamId: 'def not THAT one' })
        })
        await getBlobMetadata({ streamId: 'this one', blobId: 'bar' }, fakeBlobLookup)
        throw new Error('This should have failed')
      } catch (err) {
        if (!(err instanceof ResourceMismatch)) throw err
      }
    })
    it('for valid input return the data', async () => {
      const streamId = 'the one im looking for'
      const blobId = 'my dear blobbie'
      const fakeBlobMetadata = { streamId, blobId }
      const fakeBlobLookup = () => ({
        first: async () => fakeBlobMetadata
      })
      const blobMetadata = await getBlobMetadata({ streamId, blobId }, fakeBlobLookup)
      expect(blobMetadata).to.deep.equal(fakeBlobMetadata)
    })
  })

  describe('Query cursor handling', () => {
    describe('cursorFromRows', () => {
      it('returns base64 encoded date ISO string', () => {
        const cursorTarget = 'foo'
        const rowItem = {}
        const cursorValue = new Date()
        rowItem[cursorTarget] = cursorValue
        const createdCursor = cursorFromRows([rowItem], cursorTarget)

        expect(Buffer.from(createdCursor, 'base64').toString()).to.equal(
          cursorValue.toISOString()
        )
      })
      it('return null if rows is null or empty array', () => {
        expect(cursorFromRows([], 'cursorTarget')).to.be.null
        expect(cursorFromRows(null, 'cursorTarget')).to.be.null
      })
      it("throws if the cursor target doesn't find a date object", () => {
        try {
          cursorFromRows([{}], 'cursorTarget')
          throw new Error('This should have thrown')
        } catch (err) {
          if (!(err instanceof BadRequestError)) throw err
          expect(err.message).to.equal('The cursor target is not a date object')
        }
      })
    })

    describe('decodeCursor', () => {
      it('throws if cursor cannot be parsed into date', () => {
        try {
          decodeCursor('asdf')
          throw new Error('This should have thrown')
        } catch (err) {
          if (!(err instanceof BadRequestError)) throw err
          expect(err.message).to.equal('The cursor is not a base64 encoded date string')
        }
      })
      it('should decode cursor', () => {
        const cursor = new Date().toISOString()
        const encodedCursor = Buffer.from(cursor).toString('base64')
        const decoded = decodeCursor(encodedCursor)

        expect(decoded).to.equal(cursor)
      })
    })
  })

  describe('Get blob metadata collection', () => {
    it('When no blobs are found, no cursor returned', async () => {
      const noBlobs = await getBlobMetadataCollection({ streamId: 'foo' })
      expect(noBlobs).to.deep.equal({ blobs: [], cursor: null })
    })
    it('Returns the correct data for good input', async () => {
      const streamId = fakeIdGenerator()
      const number = 4
      const createdBlobs = await createBlobs({ streamId, number })
      const blobData = await getBlobMetadataCollection({ streamId })
      expect(blobData.blobs).to.have.lengthOf(number)
      expect(blobData.blobs.map((r) => r.id)).deep.equalInAnyOrder(
        createdBlobs.map((b) => b.id)
      )
    })

    it('Clamps limit to predefined maximum', async () => {
      const streamId = fakeIdGenerator()
      const number = 30
      const limitMax = 25
      await createBlobs({ streamId, number })
      let blobData = await getBlobMetadataCollection({ streamId })
      expect(blobData.blobs).to.have.lengthOf(limitMax)
      const localLimit = 3
      blobData = await getBlobMetadataCollection({ streamId, limit: localLimit })
      expect(blobData.blobs).to.have.lengthOf(localLimit)
    })

    it('Cursor paginates query', async () => {
      const streamId = fakeIdGenerator()
      const number = 30
      await createBlobs({ streamId, number })
      let blobData = await getBlobMetadataCollection({ streamId })
      expect(blobData.blobs).to.have.lengthOf(25)
      expect(blobData.blobs.map((blob) => blob.id)).to.deep.equalInAnyOrder(
        range(5, 30).map((index) => `${index}`.padStart(10, '0'))
      )
      blobData = await getBlobMetadataCollection({
        streamId,
        cursor: blobData.cursor
      })
      expect(blobData.blobs).to.have.lengthOf(5)
      expect(blobData.blobs.map((blob) => blob.id)).to.deep.equalInAnyOrder(
        range(5).map((index) => `${index}`.padStart(10, '0'))
      )
    })

    it('Query matches for partial file name', async () => {
      const streamId = fakeIdGenerator()
      const number = 3
      await createBlobs({ streamId, number })
      let blobData = await getBlobMetadataCollection({ streamId, query: '00000' })
      expect(blobData.blobs).to.have.lengthOf(number)
      blobData = await getBlobMetadataCollection({ streamId, query: '000002' })
      expect(blobData.blobs).to.have.lengthOf(1)
    })
  })

  describe('Get blobCollectionSummary', () => {
    it('should set values to 0 if no blobs found', async () => {
      const summary = await blobCollectionSummary({ streamId: 'foo' })
      expect(summary).to.deep.equal({ totalSize: 0, totalCount: 0 })
    })
    it('should report fileSize and count correctly', async () => {
      const streamId = fakeIdGenerator()
      const number = 30
      const fileSize = 10
      await createBlobs({ streamId, number, fileSize })
      const summary = await blobCollectionSummary({ streamId })
      expect(summary).to.deep.equal({
        totalSize: number * fileSize,
        totalCount: number
      })
    })
  })

  it('getFileStream should return content of getObjectStream', async () => {
    const fakeData = 'this is not a stream'
    const getObjectStream = async () => fakeData
    const streamId = fakeIdGenerator()
    const [blob] = await createBlobs({ streamId, number: 1 })
    const fs = await getFileStream({ getObjectStream, streamId, blobId: blob.id })
    expect(fs).to.equal(fakeData)
  })

  it('deleteBlob should delete blob data', async () => {
    const streamId = fakeIdGenerator()
    const [blob] = await createBlobs({ streamId, number: 1 })
    const blobId = blob.id
    const { objectKey } = await getBlobMetadata({ streamId, blobId })
    expect(objectKey).to.equal(blob.objectKey)
    const deleteObject = async () => {}
    await deleteBlob({ streamId, blobId, deleteObject })
    try {
      await getBlobMetadata({ streamId, blobId })
      throw new Error('This should have thrown')
    } catch (err) {
      if (!(err instanceof NotFoundError)) throw err
    }
  })

  it('markUploadOverFileSizeLimit calls delete object', async () => {
    let callCount = 0
    async function deleteObjectSpy() {
      callCount++
    }
    const streamId = fakeIdGenerator()
    const [blob] = await createBlobs({ streamId, number: 1 })
    const blobId = blob.id
    const markResult = await markUploadOverFileSizeLimit(
      deleteObjectSpy,
      streamId,
      blobId
    )

    expect(callCount).to.equal(1)
    expect(markResult).to.deep.equal({
      blobId,
      fileName: blob.fileName,
      uploadStatus: 2,
      uploadError: 'File size limit reached'
    })
  })

  it('markUploadSuccess returns with fileSize', async () => {
    const streamId = fakeIdGenerator()
    const [blob] = await createBlobs({ streamId, number: 1 })
    const blobId = blob.id
    const fileSize = 12345
    const getObjectAttributes = async () => ({ fileSize })
    const markResult = await markUploadSuccess(getObjectAttributes, streamId, blobId)
    expect(markResult).to.deep.equal({
      blobId,
      fileName: blob.fileName,
      uploadStatus: 1,
      fileSize
    })
  })
})
