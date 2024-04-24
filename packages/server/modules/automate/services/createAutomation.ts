// TODO: do the Harlem hand shake with automate
// store the automate token with the automation in the DB
// ENCRYPTION!!!
// automate authorization codes

import { storeAutomation } from '@/modules/automate/repositories/automations'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import cryptoRandomString from 'crypto-random-string'
import { createAutomation as clientCreateAutomation } from '@/modules/automate/clients/executionEngine'
import {
  createStoredAuthCode as createExecEngineAuthCode,
  validateStoredAuthCode as validateExecEngineAuthCode
} from '@/modules/automate/services/executionEngine'

export type CreateAutomationDeps = {
  createAuthCode: () => Promise<string>
  automateCreateAutomation: typeof clientCreateAutomation
}

export const createAutomation =
  (deps: CreateAutomationDeps) =>
  async (params: {
    name: string
    projectId: string
    enabled: boolean
    userId: string
  }) => {
    const { name, projectId, enabled, userId } = params
    const { createAuthCode, automateCreateAutomation } = deps

    // TODO: acl is not checked here
    // in order to create an automation, we need to reach out to automate
    // automate also needs to register the automation and gives us an automation token
    // to do the token exchange securely, automate is going to initiate a handshake

    const authCode = await createAuthCode()

    // trigger automation creation on automate
    const {
      automationId: executionEngineAutomationId,
      automationToken,
      refreshToken
    } = await automateCreateAutomation({
      speckleServerUrl: getServerOrigin(),
      authCode
    })

    const automationId = cryptoRandomString({ length: 10 })

    await storeAutomation(
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
        automateToken: automationToken,
        automateRefreshToken: refreshToken
      }
    )
  }

// TODO: Remove
export const triggerAutomationCreation = () => clientCreateAutomation
export const createStoredAuthCodeIn = createExecEngineAuthCode
export const validateStoredAuthCode = validateExecEngineAuthCode
