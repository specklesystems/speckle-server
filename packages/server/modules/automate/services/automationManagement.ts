import {
  InsertableAutomationRevision,
  InsertableAutomationRevisionFunction,
  InsertableAutomationRevisionTrigger,
  getAutomation,
  getLatestVersionAutomationRuns,
  storeAutomation,
  storeAutomationRevision,
  updateAutomation as updateDbAutomation
} from '@/modules/automate/repositories/automations'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import cryptoRandomString from 'crypto-random-string'
import {
  createAutomation as clientCreateAutomation,
  getFunctionRelease
} from '@/modules/automate/clients/executionEngine'
import { validateStreamAccess } from '@/modules/core/services/streams/streamAccessService'
import { Automate, Roles, removeNullOrUndefinedKeys } from '@speckle/shared'
import { createStoredAuthCode } from '@/modules/automate/services/executionEngine'
import {
  ProjectAutomationCreateInput,
  ProjectAutomationRevisionCreateInput,
  ProjectAutomationUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { ContextResourceAccessRules } from '@/modules/core/helpers/token'
import {
  AutomationCreationError,
  AutomationFunctionInputEncryptionError,
  AutomationRevisionCreationError,
  AutomationUpdateError
} from '@/modules/automate/errors/management'
import {
  AutomationRunStatuses,
  VersionCreationTriggerType
} from '@/modules/automate/helpers/types'
import { getBranchesByIds } from '@/modules/core/repositories/branches'
import { keyBy, uniq } from 'lodash'
import { resolveStatusFromFunctionRunStatuses } from '@/modules/automate/services/runsManagement'
import { TriggeredAutomationsStatusGraphQLReturn } from '@/modules/automate/helpers/graphTypes'
import {
  getEncryptionKeyPair,
  getFunctionInputDecryptor
} from '@/modules/automate/services/encryption'
import { LibsodiumEncryptionError } from '@/modules/shared/errors/encryption'

export type CreateAutomationDeps = {
  createAuthCode: ReturnType<typeof createStoredAuthCode>
  automateCreateAutomation: typeof clientCreateAutomation
  storeAutomation: typeof storeAutomation
}

export const createAutomation =
  (deps: CreateAutomationDeps) =>
  async (params: {
    input: ProjectAutomationCreateInput
    projectId: string
    userId: string
    userResourceAccessRules?: ContextResourceAccessRules
  }) => {
    const {
      input: { name, enabled },
      projectId,
      userId,
      userResourceAccessRules
    } = params
    const { createAuthCode, automateCreateAutomation, storeAutomation } = deps

    const nameLength = name?.length || 0
    if (nameLength < 1 || nameLength > 255) {
      throw new AutomationCreationError(
        'Automation name should be a string between the length of 1 and 255 characters.'
      )
    }

    await validateStreamAccess(
      userId,
      projectId,
      Roles.Stream.Owner,
      userResourceAccessRules
    )

    const authCode = await createAuthCode()

    // trigger automation creation on automate
    const { automationId: executionEngineAutomationId, automationToken } =
      await automateCreateAutomation({
        speckleServerUrl: getServerOrigin(),
        authCode
      })

    const automationId = cryptoRandomString({ length: 10 })

    return await storeAutomation(
      {
        id: automationId,
        name,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabled,
        projectId,
        executionEngineAutomationId
      },
      {
        automationId,
        automateToken: automationToken
      }
    )
  }

export type UpdateAutomationDeps = {
  getAutomation: typeof getAutomation
  updateAutomation: typeof updateDbAutomation
}

export const updateAutomation =
  (deps: UpdateAutomationDeps) =>
  async (params: {
    input: ProjectAutomationUpdateInput
    userId: string
    userResourceAccessRules?: ContextResourceAccessRules
    /**
     * If set, will validate that the automation belongs to that user
     */
    projectId?: string
  }) => {
    const { getAutomation, updateAutomation } = deps
    const { input, userId, userResourceAccessRules, projectId } = params

    const existingAutomation = await getAutomation({
      automationId: input.id,
      projectId
    })
    if (!existingAutomation) {
      throw new AutomationUpdateError('Automation not found')
    }

    await validateStreamAccess(
      userId,
      existingAutomation.projectId,
      Roles.Stream.Owner,
      userResourceAccessRules
    )

    // Filter out empty (null) values from input
    const updates = removeNullOrUndefinedKeys(input)

    // Skip if there's nothing left
    if (Object.keys(updates).length === 0) {
      return existingAutomation
    }

    return await updateAutomation({
      ...updates,
      id: input.id
    })
  }

type ValidateNewTriggerDefinitionsDeps = {
  getBranchesByIds: typeof getBranchesByIds
}

const validateNewTriggerDefinitions =
  (deps: ValidateNewTriggerDefinitionsDeps) =>
  async (params: {
    triggerDefinitions: InsertableAutomationRevisionTrigger[]
    projectId: string
  }) => {
    const { triggerDefinitions, projectId } = params
    const { getBranchesByIds } = deps

    if (!triggerDefinitions.length) {
      throw new AutomationRevisionCreationError(
        'At least one trigger definition is required'
      )
    }

    const invalidTriggers = triggerDefinitions.filter(
      (t) => t.triggerType !== VersionCreationTriggerType
    )
    if (invalidTriggers.length) {
      throw new AutomationRevisionCreationError(
        'Only version creation triggers are currently supported'
      )
    }

    // Validate version creation triggers
    const versionCreationTriggerDefinitions = triggerDefinitions
    const modelIds = uniq(versionCreationTriggerDefinitions.map((t) => t.triggeringId))
    const models = keyBy(
      await getBranchesByIds(modelIds, { streamId: projectId }),
      'id'
    )

    for (const modelId of modelIds) {
      const model = models[modelId]
      if (!model) {
        throw new AutomationRevisionCreationError(
          `Model with ID ${modelId} not found in project`
        )
      }
    }
  }

type ValidateNewRevisionFunctionsDeps = {
  getFunctionRelease: typeof getFunctionRelease
}

const validateNewRevisionFunctions =
  (deps: ValidateNewRevisionFunctionsDeps) =>
  async (params: { functions: InsertableAutomationRevisionFunction[] }) => {
    const { functions } = params
    const { getFunctionRelease } = deps

    const updateId = (params: { functionId: string; functionReleaseId: string }) =>
      `${params.functionId}-${params.functionReleaseId}`

    // Validate functions exist
    const uniqueUpdates = keyBy(functions, updateId)
    const releases = keyBy(
      await Promise.all(
        Object.values(uniqueUpdates).map(async (fn) => ({
          // TODO: Replace w/ batch call, when/if possible
          ...(await getFunctionRelease(fn)),
          functionId: fn.functionId
        }))
      ),
      (r) =>
        updateId({
          functionReleaseId: r.functionVersionId,
          functionId: r.functionId
        })
    )

    for (const [key, uniqueUpdate] of Object.entries(uniqueUpdates)) {
      if (!releases[key]) {
        throw new AutomationRevisionCreationError(
          `Function release for function ID ${uniqueUpdate.functionId} and function release id ${uniqueUpdate.functionReleaseId} not found`
        )
      }
    }
  }

export type CreateAutomationRevisionDeps = {
  getAutomation: typeof getAutomation
  storeAutomationRevision: typeof storeAutomationRevision
  getEncryptionKeyPair: typeof getEncryptionKeyPair
  getFunctionInputDecryptor: ReturnType<typeof getFunctionInputDecryptor>
} & ValidateNewTriggerDefinitionsDeps &
  ValidateNewRevisionFunctionsDeps

export const createAutomationRevision =
  (deps: CreateAutomationRevisionDeps) =>
  async (params: {
    input: ProjectAutomationRevisionCreateInput
    userId: string
    userResourceAccessRules?: ContextResourceAccessRules
    projectId?: string
  }) => {
    const { input, userId, userResourceAccessRules, projectId } = params
    const {
      storeAutomationRevision,
      getAutomation,
      getEncryptionKeyPair,
      getFunctionInputDecryptor
    } = deps

    const existingAutomation = await getAutomation({
      automationId: input.automationId,
      projectId
    })
    if (!existingAutomation) {
      throw new AutomationUpdateError('Automation not found')
    }

    await validateStreamAccess(
      userId,
      existingAutomation.projectId,
      Roles.Stream.Owner,
      userResourceAccessRules
    )

    const triggers = Automate.AutomateTypes.formatTriggerDefinitionSchema(
      input.triggerDefinitions
    )
    const triggerDefinitions = triggers.definitions.map((d) => {
      if (Automate.AutomateTypes.isVersionCreatedTriggerDefinition(d)) {
        const triggerDef: InsertableAutomationRevisionTrigger = {
          triggerType: VersionCreationTriggerType,
          triggeringId: d.modelId
        }

        return triggerDef
      }

      throw new AutomationRevisionCreationError('Unexpected trigger type')
    })
    await validateNewTriggerDefinitions(deps)({
      triggerDefinitions,
      projectId: projectId || existingAutomation.projectId
    })

    const encryptionKeys = await getEncryptionKeyPair()
    const decryptor = await getFunctionInputDecryptor({ keyPair: encryptionKeys })
    let functions: InsertableAutomationRevisionFunction[] = []
    try {
      functions = await Promise.all(
        input.functions.map(async (f) => {
          // Validate parameters
          await decryptor.decryptInputs(f.parameters || null)

          // Didn't throw, let's continue
          const fn: InsertableAutomationRevisionFunction = {
            functionReleaseId: f.functionReleaseId,
            functionId: f.functionId,
            functionInputs: f.parameters || null
          }

          return fn
        })
      )
    } catch (e) {
      if (e instanceof AutomationFunctionInputEncryptionError) {
        throw new AutomationRevisionCreationError(
          'One or more function inputs are not proper input objects',
          { cause: e }
        )
      }

      if (e instanceof LibsodiumEncryptionError) {
        throw new AutomationRevisionCreationError(
          'Failed to decrypt one or more function inputs. Please ensure they have been properly encrypted',
          { cause: e }
        )
      }

      throw e
    } finally {
      decryptor.dispose()
    }

    await validateNewRevisionFunctions(deps)({ functions })

    const revisionInput: InsertableAutomationRevision = {
      functions,
      triggers: triggerDefinitions,
      automationId: input.automationId,
      userId,
      active: true,
      publicKey: encryptionKeys.publicKey
    }
    return await storeAutomationRevision(revisionInput)
  }

export type GetAutomationsStatusDeps = {
  getLatestVersionAutomationRuns: typeof getLatestVersionAutomationRuns
}

export const getAutomationsStatus =
  (deps: GetAutomationsStatusDeps) =>
  async (params: {
    projectId: string
    modelId: string
    versionId: string
  }): Promise<TriggeredAutomationsStatusGraphQLReturn | null> => {
    const { projectId, modelId, versionId } = params
    const { getLatestVersionAutomationRuns } = deps

    const runs = await getLatestVersionAutomationRuns({
      projectId,
      modelId,
      versionId
    })
    if (!runs.length) return null

    // automation run has its own status field that should be up to date, but
    // lets calculate it again to be sure
    const runsWithUpdatedStatus = runs.map((r) => ({
      ...r,
      status: resolveStatusFromFunctionRunStatuses(
        r.functionRuns.map((fr) => fr.status)
      )
    }))

    const failedAutomations = runsWithUpdatedStatus.filter(
      (a) =>
        a.status === AutomationRunStatuses.failure ||
        a.status === AutomationRunStatuses.error
    )

    const runningAutomations = runsWithUpdatedStatus.filter(
      (a) => a.status === AutomationRunStatuses.running
    )
    const initializingAutomations = runsWithUpdatedStatus.filter(
      (a) => a.status === AutomationRunStatuses.pending
    )

    let status = AutomationRunStatuses.success
    let statusMessage = 'All automations have succeeded'

    if (failedAutomations.length) {
      status = AutomationRunStatuses.failure
      statusMessage = 'Some automations have failed:'
      for (const fa of failedAutomations) {
        for (const functionRunStatus of fa.functionRuns) {
          if (
            functionRunStatus.status === AutomationRunStatuses.failure ||
            functionRunStatus.status === AutomationRunStatuses.error
          )
            statusMessage += `\n${functionRunStatus.statusMessage}`
        }
      }
    } else if (runningAutomations.length) {
      status = AutomationRunStatuses.running
      statusMessage = 'Some automations are running'
    } else if (initializingAutomations.length) {
      status = AutomationRunStatuses.pending
      statusMessage = 'Some automations are initializing'
    }

    return {
      id: versionId,
      status,
      statusMessage,
      automationRuns: runsWithUpdatedStatus
    }
  }
