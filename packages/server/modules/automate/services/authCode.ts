import { automateLogger } from '@/logging/logging'
import { CreateStoredAuthCode } from '@/modules/automate/domain/operations'
import { AutomateAuthCodeHandshakeError } from '@/modules/automate/errors/management'
import cryptoRandomString from 'crypto-random-string'
import Redis from 'ioredis'
import { get, has, isObjectLike } from 'lodash'

export enum AuthCodePayloadAction {
  CreateAutomation = 'createAutomation',
  CreateFunction = 'createFunction',
  BecomeFunctionAuthor = 'becomeFunctionAuthor',
  GetAvailableGithubOrganizations = 'getAvailableGithubOrganizations',
  UpdateFunction = 'updateFunction'
}

export type AuthCodePayload = {
  code: string
  userId: string
  action: AuthCodePayloadAction
}

const isPayload = (payload: unknown): payload is AuthCodePayload =>
  !!(
    payload &&
    isObjectLike(payload) &&
    has(payload, 'code') &&
    has(payload, 'userId') &&
    has(payload, 'action') &&
    Object.values(AuthCodePayloadAction).includes(get(payload, 'action'))
  )

export const createStoredAuthCodeFactory =
  (deps: { redis: Redis }): CreateStoredAuthCode =>
  async (params: Omit<AuthCodePayload, 'code'>) => {
    const { redis } = deps

    const payload: AuthCodePayload = {
      ...params,
      code: cryptoRandomString({ length: 20 })
    }

    await redis.set(payload.code, JSON.stringify(payload), 'EX', 60 * 5)
    return payload
  }

export const validateStoredAuthCodeFactory =
  (deps: { redis: Redis }) => async (payload: AuthCodePayload) => {
    const { redis } = deps

    const potentialPayloadString = await redis.get(payload.code)
    const potentialPayload: unknown = potentialPayloadString
      ? JSON.parse(potentialPayloadString)
      : null
    const formattedPayload = isPayload(potentialPayload) ? potentialPayload : null

    if (
      !formattedPayload ||
      formattedPayload.code !== payload.code ||
      formattedPayload.userId !== payload.userId ||
      formattedPayload.action !== payload.action
    ) {
      throw new AutomateAuthCodeHandshakeError('Invalid automate auth payload')
    }

    try {
      await redis.del(payload.code)
    } catch (e) {
      automateLogger.error(e, 'Auth code deletion unexpectedly failed')
    }

    return true
  }
