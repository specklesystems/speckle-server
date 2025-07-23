import { mainDb } from '@/db/knex'
import { getMainObjectStorage } from '@/modules/blobstorage/clients/objectStorage'
import type { DataRegionsConfig } from '@/modules/multiregion/domain/types'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import {
  getMultiRegionConfig,
  setMultiRegionConfig
} from '@/modules/multiregion/regionConfig'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import type {
  CreateServerRegionInput,
  UpdateServerRegionInput
} from '@/modules/core/graph/generated/graphql'
import {
  CreateNewRegionDocument,
  GetAvailableRegionKeysDocument,
  GetRegionsDocument,
  UpdateRegionDocument
} from '@/modules/core/graph/generated/graphql'
import type { ExecuteOperationOptions, TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext, getRegionKeys } from '@/test/hooks'

import { truncateRegionsSafely } from '@/test/speckle-helpers/regions'
import { Roles } from '@speckle/shared'
import type { MultiRegionConfig } from '@speckle/shared/environment/db'
import { getConnectionSettings } from '@speckle/shared/environment/db'
import { expect } from 'chai'
import { merge } from 'lodash-es'

const isEnabled = isMultiRegionEnabled()

isEnabled
  ? describe('Multi Region Server Settings @multiregion', () => {
      let testAdminUser: BasicTestUser
      let testBasicUser: BasicTestUser
      let apollo: TestApolloServer

      const fakeRegionKey1 = 'us-west-1'
      const fakeRegionKey2 = 'eu-east-2'

      const fakeRegionConfig: DataRegionsConfig = {
        [fakeRegionKey1]: {
          postgres: {
            connectionUri: 'postgres://user:password@uswest1:port/dbname'
          },
          blobStorage: {
            accessKey: '',
            secretKey: '',
            s3Region: '',
            bucket: '',
            endpoint: '',
            createBucketIfNotExists: false
          }
        },
        [fakeRegionKey2]: {
          postgres: {
            connectionUri: 'postgres://user:password@eueast3:port/dbname'
          },
          blobStorage: {
            accessKey: '',
            secretKey: '',
            s3Region: '',
            bucket: '',
            endpoint: '',
            createBucketIfNotExists: false
          }
        }
      }

      let originalConfig: MultiRegionConfig

      before(async () => {
        // Faking multi region config (but retain active config, in case were running multiregion tests)
        originalConfig = await getMultiRegionConfig()

        const connectionUri = getConnectionSettings(mainDb).connectionString!
        const mainStorage = getMainObjectStorage()

        const regionConfig = {
          postgres: {
            connectionUri,
            skipInitialization: true
          },
          blobStorage: {
            accessKey: mainStorage.params.credentials.accessKeyId,
            secretKey: mainStorage.params.credentials.secretAccessKey,
            s3Region: mainStorage.params.region,
            bucket: mainStorage.params.bucket,
            endpoint: mainStorage.params.endpoint,
            createBucketIfNotExists: false
          }
        }
        const regionsConfig = {
          regions: {
            [fakeRegionKey1]: regionConfig,
            [fakeRegionKey2]: regionConfig
          }
        }

        setMultiRegionConfig(merge({}, originalConfig, regionsConfig))

        await beforeEachContext()
        testAdminUser = await createTestUser({ role: Roles.Server.Admin })
        testBasicUser = await createTestUser({ role: Roles.Server.User })
        apollo = await testApolloServer({ authUserId: testAdminUser.id })
      })

      after(async () => {
        setMultiRegionConfig(originalConfig)
        await truncateRegionsSafely()
      })

      describe('server config', () => {
        const createRegion = (
          input: CreateServerRegionInput,
          options?: ExecuteOperationOptions
        ) => apollo.execute(CreateNewRegionDocument, { input }, options)

        it("region keys can't be retrieved by non-admin", async () => {
          const res = await apollo.execute(
            GetAvailableRegionKeysDocument,
            {},
            {
              context: {
                userId: testBasicUser.id,
                role: Roles.Server.User
              }
            }
          )
          expect(res).to.haveGraphQLErrors('You do not have the required server role')
          expect(res.data?.serverInfo.multiRegion.availableKeys).to.be.not.ok
        })

        it('allows retrieving available config keys', async () => {
          const res = await apollo.execute(GetAvailableRegionKeysDocument, {})
          expect(res.data?.serverInfo.multiRegion.availableKeys).to.deep.equal(
            Object.keys(fakeRegionConfig)
          )
          expect(res).to.not.haveGraphQLErrors()
        })

        describe('when creating new region', async () => {
          afterEach(async () => {
            // Wipe created regions
            await truncateRegionsSafely()
          })

          it("it can't be created by non-admin", async () => {
            const res = await createRegion(
              {
                key: fakeRegionKey1,
                name: 'US West 1',
                description: 'Helloooo'
              },
              {
                context: {
                  userId: testBasicUser.id,
                  role: Roles.Server.User
                }
              }
            )
            expect(res).to.haveGraphQLErrors('You do not have the required server role')
          })

          it('it works with valid input', async () => {
            const input: CreateServerRegionInput = {
              key: fakeRegionKey1,
              name: 'US West 1',
              description: 'Helloooo'
            }

            const res = await createRegion(input)
            expect(res).to.not.haveGraphQLErrors()
            expect(res.data?.serverInfoMutations.multiRegion.create).to.deep.equal({
              ...input,
              id: input.key
            })
          })

          it("doesn't work with already used up key", async () => {
            const input: CreateServerRegionInput = {
              key: fakeRegionKey1,
              name: 'US West 1',
              description: 'Helloooo'
            }

            const res1 = await createRegion(input)
            expect(res1).to.not.haveGraphQLErrors()

            const res2 = await createRegion(input)
            expect(res2).to.haveGraphQLErrors('Region with this key already exists')
          })

          it("doesn't work with invalid key", async () => {
            const input: CreateServerRegionInput = {
              key: 'randooo-key',
              name: 'US West 1',
              description: 'Helloooo'
            }

            const res = await createRegion(input)
            expect(res).to.haveGraphQLErrors('Region key is not valid')
          })
        })

        describe('when working with existing regions', async () => {
          const createdRegionInput: CreateServerRegionInput = {
            key: fakeRegionKey1,
            name: 'US West 1',
            description: 'Helloooo'
          }

          before(async () => {
            // Create a region
            await createRegion(createdRegionInput, { assertNoErrors: true })
          })

          it("can't retrieve regions if not a server user", async () => {
            const res = await apollo.execute(
              GetRegionsDocument,
              {},
              {
                context: {
                  userId: testBasicUser.id,
                  role: Roles.Server.Guest
                }
              }
            )
            expect(res).to.haveGraphQLErrors('You do not have the required server role')
          })

          it('allows retrieving all regions', async () => {
            const res = await apollo.execute(GetRegionsDocument, {})

            expect(res).to.not.haveGraphQLErrors()
            expect(res.data?.serverInfo.multiRegion.regions).to.have.length(
              1 + getRegionKeys().length
            )
            expect(
              res.data?.serverInfo.multiRegion.regions.find(
                (r) => r.id === createdRegionInput.key
              )
            ).to.deep.equal({
              ...createdRegionInput,
              id: createdRegionInput.key
            })
          })

          it('filters out used region from available keys', async () => {
            const res = await apollo.execute(GetAvailableRegionKeysDocument, {})

            expect(res).to.not.haveGraphQLErrors()
            expect(res.data?.serverInfo.multiRegion.availableKeys).to.deep.equal([
              fakeRegionKey2
            ])
          })
        })

        describe('when updating existing region', async () => {
          const createdRegionInput: CreateServerRegionInput = {
            key: fakeRegionKey2,
            name: 'Updatable Region 1',
            description: 'Helloooo'
          }

          const updateRegion = (
            input: UpdateServerRegionInput,
            options?: ExecuteOperationOptions
          ) => apollo.execute(UpdateRegionDocument, { input }, options)

          beforeEach(async () => {
            // Create new region
            await createRegion(createdRegionInput, { assertNoErrors: true })
          })

          afterEach(async () => {
            // Wipe created regions
            await truncateRegionsSafely()
          })

          it("can't update region if non-admin", async () => {
            const res = await updateRegion(
              {
                key: createdRegionInput.key,
                name: 'Updated Region 1'
              },
              {
                context: {
                  userId: testBasicUser.id,
                  role: Roles.Server.User
                }
              }
            )
            expect(res).to.haveGraphQLErrors('You do not have the required server role')
          })

          it('works with valid input', async () => {
            const updatedName = 'aaa Updated Region 1'
            const updatedDescription = 'bbb Updated description'

            const res = await updateRegion({
              key: createdRegionInput.key,
              name: updatedName,
              description: updatedDescription
            })

            expect(res.data?.serverInfoMutations.multiRegion.update).to.deep.equal({
              ...createdRegionInput,
              id: createdRegionInput.key,
              name: updatedName,
              description: updatedDescription
            })
            expect(res).to.not.haveGraphQLErrors()
          })

          it('fails gracefully with invalid region key', async () => {
            const res = await updateRegion({
              key: 'invalid-key',
              name: 'Updated Region 1'
            })

            expect(res).to.haveGraphQLErrors('Region not found')
            expect(res.data?.serverInfoMutations.multiRegion.update).to.be.not.ok
          })
        })
      })
    })
  : void 0
