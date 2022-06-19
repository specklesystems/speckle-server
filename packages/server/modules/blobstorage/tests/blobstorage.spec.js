const expect = require('chai').expect
const { beforeEachContext } = require('@/test/hooks')
const { uploadFileStream } = require('@/modules/blobstorage/services')
const crs = require('crypto-random-string')

const fakeIdGenerator = () => crs({ length: 10 })
const fakeFileStreamStore = (fakeHash) => async () => ({ fileHash: fakeHash })

describe('Blob storage @blobstorage', () => {
  // const user = {
  //   name: 'Baron Von Blubba',
  //   email: 'barron@bubble.bobble',
  //   password: 'bubblesAreMyBlobs'
  // }

  before(async () => {
    await beforeEachContext()
  })

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
