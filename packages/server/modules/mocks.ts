/* eslint-disable @typescript-eslint/no-explicit-any */
import { LimitedUser, Resolvers } from '@/modules/core/graph/generated/graphql'
// import { isDevEnv } from '@/modules/shared/helpers/envHelper'
import { Roles } from '@speckle/shared'
import { times } from 'lodash'
import { IMockStore, IMocks } from '@graphql-tools/mock'
import dayjs from 'dayjs'
import { Branches } from '@/modules/core/dbSchema'

/**
 * Define mocking config in dev env
 * https://www.apollographql.com/docs/apollo-server/v3/testing/mocking
 */
export async function buildMocksConfig(): Promise<{
  mocks: boolean | IMocks
  mockEntireSchema: boolean
  resolvers?: Resolvers | ((store: IMockStore) => Resolvers)
}> {
  // TODO: Disable before merging!
  // const isDebugEnv = isDevEnv()
  // if (!isDebugEnv) return { mocks: false, mockEntireSchema: false } // we def don't want this on in prod

  // feel free to define mocks for your dev env below
  const { faker } = await import('@faker-js/faker')

  return {
    resolvers: (store) => ({
      Query: {
        automateFunctions: (_parent, args) => {
          const count = args.limit || faker.datatype.number({ min: 4, max: 20 })

          return {
            cursor: null,
            totalCount: count,
            items: times(count, () => store.get('AutomateFunction'))
          } as any
        },
        automateFunction: (_parent, args) => {
          const id = args.id
          return store.get('AutomateFunction', { id }) as any
        }
      },
      Project: {
        automations: (_parent, args) => {
          const forceAutomations = false
          const forceNoAutomations = false

          const limit = args.limit || faker.datatype.number({ min: 4, max: 20 })
          let count
          if (forceNoAutomations) {
            count = 0
          } else {
            count = forceAutomations ? limit : faker.datatype.boolean() ? limit : 0
          }

          return {
            cursor: null,
            totalCount: count,
            items: times(count, () => store.get('Automation'))
          } as any
        }
      },
      Automation: {
        runs: (_parent, args) => {
          const count = args.limit || faker.datatype.number({ min: 4, max: 20 })

          return {
            cursor: null,
            totalCount: count,
            items: times(count, () => store.get('AutomateRun'))
          } as any
        },
        model: async () => {
          return Branches.knex().first()
        }
      },
      ProjectAutomationMutations: {
        update: (_parent, args) => {
          const {
            input: { id, name }
          } = args
          const automation = store.get('Automation') as any
          return {
            ...automation,
            id,
            ...(name?.length ? { name } : {})
          }
        }
      }
    }),
    mocks: {
      AutomationRevision: () => ({
        functions: () => [undefined] // array of 1 always
      }),
      Automation: () => ({
        name: () => faker.company.companyName(),
        enabled: () => faker.datatype.boolean()
      }),
      AutomateFunction: () => ({
        name: () => faker.commerce.productName(),
        isFeatured: () => faker.datatype.boolean(),
        description: () => {
          // Random length lorem ipsum
          return faker.lorem.paragraphs(
            faker.datatype.number({ min: 1, max: 3 }),
            '\n\n'
          )
        },
        logo: () => {
          const random = faker.datatype.number({ min: 0, max: 3 })
          return random
            ? faker.image.imageUrl(undefined, undefined, undefined, true)
            : null
        }
      }),
      AutomateFunctionRelease: () => ({
        versionTag: () => {
          // Fake semantic version
          return `${faker.datatype.number({ min: 0, max: 9 })}.${faker.datatype.number({
            min: 0,
            max: 9
          })}.${faker.datatype.number({ min: 0, max: 9 })}`
        },
        inputSchema: () => {
          // random fro 1 to 3
          const rand = faker.datatype.number({ min: 1, max: 3 })
          switch (rand) {
            case 1:
              return {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                $id: 'https://example.com/product.schema.json',
                title: 'Product',
                description: "A product from Acme's catalog",
                type: 'object',
                properties: {
                  name: {
                    desciption: 'Random name',
                    type: 'string'
                  },
                  productId: {
                    description: 'The unique identifier for a product',
                    type: 'integer'
                  }
                },
                required: ['productId']
              }
            default:
              return null
          }
        }
      }),
      AutomateRun: () => ({
        reason: () => faker.lorem.sentence(),
        id: () => faker.random.alphaNumeric(20),
        createdAt: () =>
          faker.date
            .recent(undefined, dayjs().subtract(1, 'day').toDate())
            .toISOString(),
        updatedAt: () => faker.date.recent().toISOString()
      }),
      LimitedUser: () =>
        ({
          id: faker.datatype.uuid(),
          name: faker.name.findName(),
          avatar: faker.image.avatar(),
          bio: faker.lorem.sentence(),
          company: faker.company.companyName(),
          verified: faker.datatype.boolean(),
          role: Roles.Server.User
        } as LimitedUser),
      JSONObject: () => ({}),
      ID: () => faker.datatype.uuid(),
      DateTime: () => faker.date.recent().toISOString(),
      Model: () => ({
        id: () => faker.datatype.uuid(),
        name: () => faker.commerce.productName(),
        previewUrl: () => faker.image.imageUrl()
      }),
      Version: () => ({
        id: () => faker.random.alphaNumeric(10)
      })
    },
    mockEntireSchema: false
  }
}
