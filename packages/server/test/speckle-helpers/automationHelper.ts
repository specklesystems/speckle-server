import {
  getAutomationFactory,
  storeAutomationFactory,
  storeAutomationRevisionFactory,
  storeAutomationTokenFactory
} from '@/modules/automate/repositories/automations'
import {
  CreateAutomationRevisionDeps,
  createAutomationFactory,
  createAutomationRevisionFactory
} from '@/modules/automate/services/automationManagement'
import { createStoredAuthCodeFactory } from '@/modules/automate/services/authCode'
import { createInmemoryRedisClient } from '@/test/redisHelper'
import cryptoRandomString from 'crypto-random-string'
import { createAutomation as clientCreateAutomation } from '@/modules/automate/clients/executionEngine'
import {
  getBranchesByIdsFactory,
  getLatestStreamBranchFactory
} from '@/modules/core/repositories/branches'

import {
  ProjectAutomationCreateInput,
  ProjectAutomationRevisionCreateInput
} from '@/modules/core/graph/generated/graphql'
import { Automate } from '@speckle/shared'
import { truncateTables } from '@/test/hooks'
import {
  AutomationRevisions,
  AutomationRunTriggers,
  AutomationRuns,
  AutomationTokens,
  AutomationTriggers,
  Automations
} from '@/modules/core/dbSchema'
import { faker } from '@faker-js/faker'
import {
  getEncryptionKeyPair,
  getFunctionInputDecryptorFactory
} from '@/modules/automate/services/encryption'
import { buildDecryptor } from '@/modules/shared/utils/libsodium'
import { db } from '@/db/knex'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { Knex } from 'knex'

const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })

export const generateFunctionId = () => cryptoRandomString({ length: 10 })
export const generateFunctionReleaseId = () => cryptoRandomString({ length: 10 })

/**
 * @param overrides By default, we mock requests to the execution engine. You can replace those mocks here.
 */
export const buildAutomationCreate = (
  params: {
    dbClient: Knex
    overrides?: Partial<{
      createDbAutomation: typeof clientCreateAutomation
    }>
  } = {
    dbClient: db
  }
) => {
  const { dbClient, overrides } = params

  const create = createAutomationFactory({
    createAuthCode: createStoredAuthCodeFactory({ redis: createInmemoryRedisClient() }),
    automateCreateAutomation:
      overrides?.createDbAutomation ||
      (async () => ({
        automationId: cryptoRandomString({ length: 10 }),
        token: cryptoRandomString({ length: 10 })
      })),
    storeAutomation: storeAutomationFactory({ db: dbClient }),
    storeAutomationToken: storeAutomationTokenFactory({ db: dbClient }),
    validateStreamAccess,
    eventEmit: getEventBus().emit
  })

  return create
}

/**
 * @param overrides By default, we mock requests to the execution engine. You can replace those mocks here.
 */
export const buildAutomationRevisionCreate = (
  params: {
    dbClient: Knex
    overrides?: Partial<CreateAutomationRevisionDeps>
  } = {
    dbClient: db
  }
) => {
  const { dbClient, overrides } = params

  const fakeGetRelease = (params: {
    functionReleaseId: string
    functionId: string
  }) => ({
    functionVersionId: params.functionReleaseId,
    versionTag: faker.system.semver(),
    inputSchema: null,
    createdAt: new Date().toISOString(),
    commitId: faker.git.commitSha({ length: 7 }),
    functionId: params.functionId
  })

  const create = createAutomationRevisionFactory({
    getAutomation: getAutomationFactory({ db: dbClient }),
    storeAutomationRevision: storeAutomationRevisionFactory({ db: dbClient }),
    getBranchesByIds: getBranchesByIdsFactory({ db: dbClient }),
    getFunctionRelease: async (params) => fakeGetRelease(params),
    getFunctionReleases: async (params) => params.ids.map(fakeGetRelease),
    getEncryptionKeyPair,
    getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
      buildDecryptor
    }),
    validateStreamAccess,
    eventEmit: getEventBus().emit,
    ...overrides
  })

  return create
}

/**
 * Quick way to create an automation and optionally one revision
 */
export const createTestAutomation = async (params: {
  userId: string
  projectId: string
  automation?: Partial<ProjectAutomationCreateInput>
  revision?: {
    input?: Partial<ProjectAutomationRevisionCreateInput>
    functionReleaseId: string
    functionId: string
  }
}) => {
  const {
    userId,
    projectId,
    automation,
    revision: { input: revisionInput, functionReleaseId, functionId } = {}
  } = params

  const projectDb = await getProjectDbClient({ projectId })

  const createAutomation = buildAutomationCreate({ dbClient: projectDb })
  const createRevision = buildAutomationRevisionCreate({ dbClient: projectDb })

  const automationRet = await createAutomation({
    input: {
      name: `Test Automation #${cryptoRandomString({ length: 5 })}`,
      enabled: true,
      ...automation
    },
    projectId,
    userId
  })

  let revisionRet: Awaited<ReturnType<typeof createRevision>> | null = null
  if (functionReleaseId?.length && functionId?.length) {
    const firstModel = await getLatestStreamBranchFactory({ db: projectDb })(projectId)

    if (!firstModel)
      throw new Error(
        'Project does not have any models for automation revision triggers'
      )

    revisionRet = await createRevision({
      input: {
        automationId: automationRet.automation.id,
        functions: [
          {
            functionId,
            functionReleaseId,
            parameters: null
          }
        ],
        triggerDefinitions: <Automate.AutomateTypes.TriggerDefinitionsSchema>{
          version: 1.0,
          definitions: [
            {
              type: 'VERSION_CREATED',
              modelId: firstModel.id
            }
          ]
        },
        ...revisionInput
      },
      projectId,
      userId
    })
  }

  return {
    automation: automationRet,
    revision: revisionRet
  }
}

export type TestAutomationWithRevision = Awaited<
  ReturnType<typeof createTestAutomation>
>

// export const createTestAutomationRun = async (params: {
//   automationId: string
//   automationRunData?: Partial<AutomationRunRecord>
//   automationFunctionRunData?: Partial<AutomationFunctionRunRecord>[]
// }) => {
//   const { automationId, automationRunData = {}, automationFunctionRunData = {} } = params

//   const latestRevision = getLatestAutomationRevisionFactory({ db })
// }

export const truncateAutomations = async () => {
  await truncateTables([
    AutomationRunTriggers.name,
    AutomationRuns.name,
    AutomationTriggers.name,
    AutomationTokens.name,
    AutomationRevisions.name,
    Automations.name
  ])
}
