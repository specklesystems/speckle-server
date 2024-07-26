import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  mockedApiModules,
  isProdEnv,
  isTestEnv
} from '@/modules/shared/helpers/envHelper'
import { reduce } from 'lodash'
import { IMockStore, IMocks } from '@graphql-tools/mock'

import { moduleMockConfigs } from '@/modules'
import { isNonNullable } from '@speckle/shared'

export type SpeckleModuleMocksConfig = {
  resolvers?: (store: IMockStore) => Resolvers
  mocks?: IMocks
}

/**
 * Base config that always needs to be loaded, cause it sets up core primitives
 */
const buildBaseConfig = async (): Promise<SpeckleModuleMocksConfig> => {
  // Async import so that we only import this when envs actually have mocks on
  const faker = (await import('@faker-js/faker')).faker

  return {
    mocks: {
      JSONObject: () => ({}),
      ID: () => faker.datatype.uuid(),
      DateTime: () => faker.date.recent().toISOString()
    }
  }
}
/**
 * Define mocking config in dev env
 * https://www.apollographql.com/docs/apollo-server/v3/testing/mocking
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
    const allResolvers = allResolversBuilders.map((builder) => builder(store))

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
