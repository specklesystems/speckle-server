//TODO do the Harlem hand shake with automate
// store the automate token with the automation in the DB
// ENCRYPTION!!!
// automate authorization codes

import { storeAutomation } from '@/modules/automate/repositories'
import { getServerOrigin, speckleAutomateUrl } from '@/modules/shared/helpers/envHelper'
import cryptoRandomString from 'crypto-random-string'
import { Redis } from 'ioredis'

export type AutomationCreationArgs = {
  name: string
  projectId: string
  enabled: boolean
  userId: string
}

export const createAutomation =
  (
    createAuthCode: () => Promise<string>,
    automateCreateAutomation: (
      args: AutomateCreateArgs
    ) => Promise<AutomateCreateResponse>
  ) =>
  async ({ name, projectId, enabled, userId }: AutomationCreationArgs) => {
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

type AutomateCreateArgs = {
  speckleServerUrl: string
  authCode: string
}

type AutomateCreateResponse = {
  automationId: string
  automationToken: string
  refreshToken: string
}

export const triggerAutomationCreation = async ({
  speckleServerUrl,
  authCode
}: AutomateCreateArgs): Promise<AutomateCreateResponse> => {
  const automateUrl = speckleAutomateUrl()
  if (!automateUrl)
    throw new Error('Cannot create automation, Automate URL is not configured')
  const url = `${automateUrl}/api/v2/automations`

  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ speckleServerUrl, authCode })
  })

  const result = (await response.json()) as AutomateCreateResponse
  return result
}

export const createStoredAuthCodeIn = (redis: Redis) => async () => {
  const codeId = cryptoRandomString({ length: 10 })
  const authCode = cryptoRandomString({ length: 20 })
  // prob hashing and salting it would be better, but they expire in 2 mins...
  await redis.set(codeId, authCode, 'EX', 120)
  return `${codeId}${authCode}`
}
