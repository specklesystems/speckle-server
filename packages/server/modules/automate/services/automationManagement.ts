import {
  getAutomation,
  storeAutomation,
  updateAutomation as updateDbAutomation
} from '@/modules/automate/repositories/automations'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import cryptoRandomString from 'crypto-random-string'
import { createAutomation as clientCreateAutomation } from '@/modules/automate/clients/executionEngine'
import { validateStreamAccess } from '@/modules/core/services/streams/streamAccessService'
import { Roles, removeNullOrUndefinedKeys } from '@speckle/shared'
import { createStoredAuthCode } from '@/modules/automate/services/executionEngine'
import {
  ProjectAutomationCreateInput,
  ProjectAutomationUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { ContextResourceAccessRules } from '@/modules/core/helpers/token'
import {
  AutomationCreationError,
  AutomationUpdateError
} from '@/modules/automate/errors/management'

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
    projectId: string
    userId: string
    userResourceAccessRules?: ContextResourceAccessRules
  }) => {
    const { getAutomation, updateAutomation } = deps
    const { input, userId, projectId, userResourceAccessRules } = params

    const [, existingAutomation] = await Promise.all([
      validateStreamAccess(
        userId,
        projectId,
        Roles.Stream.Owner,
        userResourceAccessRules
      ),
      getAutomation({ automationId: input.id })
    ])
    if (!existingAutomation) {
      throw new AutomationUpdateError('Automation not found')
    }

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
