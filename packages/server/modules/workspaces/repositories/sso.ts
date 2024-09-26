import {
  oidcProvider,
  GetOIDCProviderData,
  StoreOIDCProviderValidationRequest
} from '@/modules/workspaces/domain/sso'
import Redis from 'ioredis'

export const storeOIDCProviderValidationRequestFactory =
  ({
    redis,
    encrypt
  }: {
    redis: Redis
    encrypt: (input: string) => Promise<string>
  }): StoreOIDCProviderValidationRequest =>
  async ({ provider, token }) => {
    const providerData = await encrypt(JSON.stringify(provider))
    await redis.set(token, providerData)
  }

export const getOIDCProviderFactory =
  ({
    redis,
    decrypt
  }: {
    redis: Redis
    decrypt: (input: string) => Promise<string>
  }): GetOIDCProviderData =>
  async ({ validationToken }: { validationToken: string }) => {
    const encryptedProviderData = await redis.get(validationToken)
    if (!encryptedProviderData) return null
    const provider = oidcProvider.parse(
      JSON.parse(await decrypt(encryptedProviderData))
    )
    return provider
  }
