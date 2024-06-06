import { AutomateAuthCodeHandshakeError } from '@/modules/automate/errors/management'
import cryptoRandomString from 'crypto-random-string'
import Redis from 'ioredis'

export const createStoredAuthCode = (deps: { redis: Redis }) => async () => {
  const { redis } = deps
  const codeId = cryptoRandomString({ length: 10 })
  const authCode = cryptoRandomString({ length: 20 })
  // prob hashing and salting it would be better, but they expire in 5 mins...
  await redis.set(codeId, authCode, 'EX', 60 * 5)
  return `${codeId}${authCode}`
}

export const validateStoredAuthCode =
  (deps: { redis: Redis }) => async (code: string) => {
    const { redis } = deps
    const codeId = code.slice(0, 10)
    const authCode = code.slice(10)
    const storedAuthCode = await redis.get(codeId)

    if (!storedAuthCode || authCode !== storedAuthCode) {
      throw new AutomateAuthCodeHandshakeError('Invalid automate auth code')
    }

    return true
  }
