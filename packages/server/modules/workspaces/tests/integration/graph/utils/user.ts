import { createUser } from '@/modules/core/services/users'
import { createToken } from '@/modules/core/services/tokens'
import cryptoRandomString from 'crypto-random-string'
import { AllScopes } from '@speckle/shared'

export const createTestUserAndToken = async () => {
  const userId = await createUser({
    name: 'John Speckle',
    email: `${cryptoRandomString({ length: 6 })}@example.org`,
    password: 'high-quality-password'
  })

  const { token } = await createToken({
    userId,
    name: "John's test token",
    scopes: AllScopes
  })

  return { userId, token }
}
