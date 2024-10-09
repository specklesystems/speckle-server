import { ProjectVisibility, Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  mockedApiModules,
  isProdEnv,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { has, reduce } from 'lodash'
import { IMockStore, IMocks } from '@graphql-tools/mock'

import { moduleMockConfigs } from '@/modules'
import { isNonNullable, Roles, SourceAppNames } from '@speckle/shared'
import {
  getRandomDbRecords,
  mockStoreHelpers,
  SpeckleModuleMocksConfig
} from '@/modules/shared/helpers/mocks'
import { Streams } from '@/modules/core/dbSchema'

/**
 * Base config that always needs to be loaded, cause it sets up core primitives
 */
const buildBaseConfig = async (): Promise<SpeckleModuleMocksConfig> => {
  // Async import so that we only import this when envs actually have mocks on
  const faker = (await import('@faker-js/faker')).faker

  return {
    resolvers: ({ helpers: { getFieldValue }, store }) => ({
      Query: {
        _: () => {
          store.reset()
          return 'Mock Store reset!'
        }
      },
      LimitedUser: {
        role: (parent) =>
          getFieldValue(
            { type: 'LimitedUser', id: getFieldValue(parent, 'id') },
            'role'
          )
      },
      ProjectCollection: {
        items: async (parent) => {
          // In case a real project collection was built, we skip mocking it
          if (has(parent, 'items')) return parent.items

          const count = getFieldValue(parent, 'totalCount')

          // To avoid having to mock projects fully, we pull real ones from the DB
          return await getRandomDbRecords({ tableName: Streams.name, min: count })
        }
      }
    }),
    mocks: {
      // Primitives
      JSONObject: () => ({}),
      ID: () => faker.string.uuid(),
      DateTime: () => faker.date.recent().toISOString(),
      Boolean: () => faker.datatype.boolean(),
      // Base objects
      LimitedUser: () => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        avatar: faker.image.avatar(),
        bio: faker.lorem.sentence(),
        company: faker.company.name(),
        verified: faker.datatype.boolean(),
        role: Roles.Server.User
      }),
      Project: () => ({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.lorem.sentence(),
        visibility: faker.helpers.arrayElement(Object.values(ProjectVisibility)),
        role: faker.helpers.arrayElement(Object.values(Roles.Stream)),
        sourceApps: faker.helpers.arrayElements(SourceAppNames, { min: 0, max: 5 })
      }),
      ProjectCollection: () => ({
        totalCount: faker.number.int({ min: 0, max: 10 })
      })
    }
  }
}

/**
 * Define mocking config in dev env
 * https://www.apollographql.com/docs/apollo-server/testing/mocking
 */
export async function buildMocksConfig(): Promise<{
  mocks: boolean | IMocks
  mockEntireSchema: boolean
  resolvers?: Resolvers | ((store: IMockStore) => Resolvers)
}> {
  const mockableModuleList = mockedApiModules()
  const enable = mockableModuleList.length && !isTestEnv() && !isProdEnv()
  if (!enable) {
    return { mocks: false, mockEntireSchema: false }
  }

  const configs = moduleMockConfigs(mockableModuleList)
  if (!Object.keys(configs).length) {
    return { mocks: false, mockEntireSchema: false }
  }

  const allConfigs = { base: await buildBaseConfig(), ...configs }

  // Merge configs into one
  const mocks: IMocks = reduce(
    allConfigs,
    (acc, config) => {
      return { ...acc, ...(config.mocks || {}) }
    },
    {} as IMocks
  )
  const resolvers: (store: IMockStore) => Resolvers = (store) => {
    const allResolversBuilders = Object.values(allConfigs)
      .map((c) => c.resolvers)
      .filter(isNonNullable)
    const allResolvers = allResolversBuilders.map((builder) =>
      builder({ store, helpers: mockStoreHelpers(store) })
    )

    // Deep merge all resolvers
    const resolvers = allResolvers.reduce((acc, resolvers) => {
      for (const [typeName, typeResolvers] of Object.entries(resolvers)) {
        if (!acc[typeName]) {
          acc[typeName] = {}
        }

        Object.assign(acc[typeName], typeResolvers)
      }
      return acc
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any>)

    return resolvers as Resolvers
  }

  return {
    mocks,
    resolvers,
    mockEntireSchema: false
  }
}

export type AppMocksConfig = Awaited<ReturnType<typeof buildMocksConfig>>
