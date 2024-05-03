import {
  InsertableAutomationRevision,
  InsertableAutomationRevisionFunction,
  InsertableAutomationRevisionTrigger,
  getAutomation,
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
import {
  Automate,
  Nullable,
  Roles,
  ensureError,
  removeNullOrUndefinedKeys
} from '@speckle/shared'
import { createStoredAuthCode } from '@/modules/automate/services/executionEngine'
import {
  ProjectAutomationCreateInput,
  ProjectAutomationRevisionCreateInput,
  ProjectAutomationUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { ContextResourceAccessRules } from '@/modules/core/helpers/token'
import {
  AutomationCreationError,
  AutomationRevisionCreationError,
  AutomationUpdateError
} from '@/modules/automate/errors/management'
import { VersionCreationTriggerType } from '@/modules/automate/helpers/types'
import { getBranchesByIds } from '@/modules/core/repositories/branches'
import { keyBy, uniq } from 'lodash'

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

type CreateAutomationRevisionDeps = {
  getAutomation: typeof getAutomation
  storeAutomationRevision: typeof storeAutomationRevision
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
    const { storeAutomationRevision, getAutomation } = deps

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

    const functions = input.functions.map((f) => {
      // TODO: Encryption?
      let inputs: Nullable<Record<string, unknown>> = null
      try {
        if (f.parameters?.length) {
          inputs = JSON.parse(f.parameters)
        }
      } catch (e) {
        throw new AutomationRevisionCreationError(
          "Couldn't parse function parameters",
          {
            cause: ensureError(e),
            info: {
              parameters: f.parameters
            }
          }
        )
      }

      const fn: InsertableAutomationRevisionFunction = {
        functionReleaseId: f.functionReleaseId,
        functionId: f.functionId,
        functionInputs: inputs
      }

      return fn
    })
    await validateNewRevisionFunctions(deps)({ functions })

    const revisionInput: InsertableAutomationRevision = {
      functions,
      triggers: triggerDefinitions,
      automationId: input.automationId,
      userId,
      active: true
    }
    return await storeAutomationRevision(revisionInput)
  }
