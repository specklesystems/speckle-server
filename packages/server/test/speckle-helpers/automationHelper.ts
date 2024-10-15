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
import { AutomationsEmitter } from '@/modules/automate/events/automations'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'

const storeAutomation = storeAutomationFactory({ db })
const storeAutomationToken = storeAutomationTokenFactory({ db })
const storeAutomationRevision = storeAutomationRevisionFactory({ db })
const getAutomation = getAutomationFactory({ db })
const getLatestStreamBranch = getLatestStreamBranchFactory({ db })
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })

export const generateFunctionId = () => cryptoRandomString({ length: 10 })
export const generateFunctionReleaseId = () => cryptoRandomString({ length: 10 })

export const buildAutomationCreate = (
  overrides?: Partial<{
    createDbAutomation: typeof clientCreateAutomation
  }>
) => {
  const create = createAutomationFactory({
    createAuthCode: createStoredAuthCodeFactory({ redis: createInmemoryRedisClient() }),
    automateCreateAutomation:
      overrides?.createDbAutomation ||
      (async () => ({
        automationId: cryptoRandomString({ length: 10 }),
        token: cryptoRandomString({ length: 10 })
      })),
    storeAutomation,
    storeAutomationToken,
    validateStreamAccess,
    automationsEventsEmit: AutomationsEmitter.emit
  })

  return create
}

export const buildAutomationRevisionCreate = (
  overrides?: Partial<CreateAutomationRevisionDeps>
) => {
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
    getAutomation,
    storeAutomationRevision,
    getBranchesByIds: getBranchesByIdsFactory({ db }),
    getFunctionRelease: async (params) => fakeGetRelease(params),
    getFunctionReleases: async (params) => params.ids.map(fakeGetRelease),
    getEncryptionKeyPair,
    getFunctionInputDecryptor: getFunctionInputDecryptorFactory({
      buildDecryptor
    }),
    validateStreamAccess,
    automationsEventsEmit: AutomationsEmitter.emit,
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

  const createAutomation = buildAutomationCreate()
  const createRevision = buildAutomationRevisionCreate()

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
    const firstModel = await getLatestStreamBranch(projectId)

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
