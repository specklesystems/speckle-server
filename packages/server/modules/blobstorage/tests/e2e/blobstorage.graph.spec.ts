import { buildApolloServer } from '@/app'
import { truncateTables } from '@/test/hooks'
import gql from 'graphql-tag'
import { createBlobs } from '@/modules/blobstorage/tests/helpers'
import { expect } from 'chai'
import { Users, Streams } from '@/modules/core/dbSchema'
import type { ServerAndContext } from '@/test/graphqlHelper'
import { createAuthedTestContext, executeOperation } from '@/test/graphqlHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { buildBasicTestProject } from '@/modules/core/tests/helpers/creation'

describe('Blobs graphql @blobstorage', () => {
  let graphqlServer: ServerAndContext
  let user: BasicTestUser

  before(async () => {
    await truncateTables(['blob_storage', Users.name, Streams.name])
    user = await createTestUser({
      name: 'Baron Von Blubba',
      email: 'zebarron@bubble.bobble',
      password: 'bubblesAreMyBlobs',
      id: ''
    })
    graphqlServer = {
      apollo: await buildApolloServer(),
      context: await createAuthedTestContext(user.id)
    }
  })

  it('Stream has blob metadata for a single blob', async () => {
    const query = gql`
      query ($streamId: String!, $blobId: String!) {
        stream(id: $streamId) {
          id
          blob(id: $blobId) {
            id
            fileName
            uploadStatus
            fileSize
            fileHash
          }
        }
      }
    `
    const { id: streamId } = await createTestStream(buildBasicTestProject(), user)
    const [blob] = await createBlobs({ streamId, number: 1 })

    const result = await executeOperation(graphqlServer, query, {
      streamId,
      blobId: blob.id
    })

    const blobMetadata = result.data!.stream.blob
    expect(blobMetadata.id).to.equal(blob.id)
    expect(blobMetadata.fileSize).to.equal(blob.fileSize)
    expect(blobMetadata.fileHash).to.equal(blob.fileHash)
  })

  it('Blob metadata collection returns proper summary values', async () => {
    const query = gql`
      query ($streamId: String!) {
        stream(id: $streamId) {
          id
          blobs {
            totalCount
            totalSize
          }
        }
      }
    `
    const { id: streamId } = await createTestStream(buildBasicTestProject(), user)
    const number = 10
    const fileSize = 123
    await createBlobs({ streamId, number, fileSize })
    const result = await executeOperation(graphqlServer, query, { streamId })
    expect(result.data!.stream.blobs.totalCount).to.equal(number)
    expect(result.data!.stream.blobs.totalSize).to.equal(number * fileSize)
  })
})
