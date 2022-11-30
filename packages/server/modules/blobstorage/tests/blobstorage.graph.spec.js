const { buildApolloServer } = require('@/app')
const { addLoadersToCtx } = require('@/modules/shared/middleware')
const { truncateTables } = require('@/test/hooks')
const { Roles, AllScopes } = require('@/modules/core/helpers/mainConstants')
const { createStream } = require('@/modules/core/services/streams')
const { createUser } = require('@/modules/core/services/users')
const crs = require('crypto-random-string')
const { gql } = require('apollo-server-express')
const { createBlobs } = require('@/modules/blobstorage/tests/helpers')
const { expect } = require('chai')
const { Users, Streams } = require('@/modules/core/dbSchema')

describe('Blobs graphql @blobstorage', () => {
  /** @type {import('apollo-server-express').ApolloServer} */
  let apollo
  const user = {
    name: 'Baron Von Blubba',
    email: 'zebarron@bubble.bobble',
    password: 'bubblesAreMyBlobs'
  }
  before(async () => {
    await truncateTables(['blob_storage', Users.name, Streams.name])
    user.id = await createUser(user)
    apollo = await buildApolloServer({
      context: () =>
        addLoadersToCtx({
          auth: true,
          userId: crs({ length: 10 }),
          role: Roles.Server.User,
          token: 'asd',
          scopes: AllScopes
        })
    })
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
    const streamId = await createStream({ ownerId: user.id })
    const [blob] = await createBlobs({ streamId, number: 1 })
    const result = await apollo.executeOperation({
      query,
      variables: {
        streamId,
        blobId: blob.id
      }
    })
    const blobMetadata = result.data.stream.blob
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
    const streamId = await createStream({ ownerId: user.id })
    const number = 10
    const fileSize = 123
    await createBlobs({ streamId, number, fileSize })
    const result = await apollo.executeOperation({ query, variables: { streamId } })
    expect(result.data.stream.blobs.totalCount).to.equal(number)
    expect(result.data.stream.blobs.totalSize).to.equal(number * fileSize)
  })
})
