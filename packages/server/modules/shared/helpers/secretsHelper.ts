import { MisconfiguredSecretError } from '@/modules/shared/errors'
import { existsSync, readFile } from 'fs'
import { join } from 'path'

let redisUrl: string | undefined
let postgresUrl: string | undefined
let sessionSecret: string | undefined
let emailPassword: string | undefined
let s3SecretKey: string | undefined
let googleClientSecret: string | undefined
let githubClientSecret: string | undefined
let azureADClientSecret: string | undefined
let apolloKey: string | undefined

export function getRedisUrl(): string | undefined {
  if (!redisUrl) redisUrl = getSecret('redis_url')
  return redisUrl
}

export function getPostgresUrl(): string | undefined {
  if (!postgresUrl) postgresUrl = getSecret('postgres_url')
  return postgresUrl
}

export function getSessionSecret(): string | undefined {
  if (!sessionSecret) sessionSecret = getSecret('session_secret')
  return sessionSecret
}

export function getEmailPassword(): string | undefined {
  if (!emailPassword) emailPassword = getSecret('email_password')
  return emailPassword
}

export function getS3SecretKey(): string | undefined {
  if (!s3SecretKey) s3SecretKey = getSecret('s3_secret_key')
  return s3SecretKey
}

export function getGoogleClientSecret(): string | undefined {
  if (!googleClientSecret) googleClientSecret = getSecret('google_client_secret')
  return googleClientSecret
}

export function getGitHubClientSecret(): string | undefined {
  if (!githubClientSecret) githubClientSecret = getSecret('github_client_secret')
  return githubClientSecret
}

export function getAzureADClientSecret(): string | undefined {
  if (!azureADClientSecret) azureADClientSecret = getSecret('azure_ad_client_secret')
  return azureADClientSecret
}

export function getApolloKey(): string | undefined {
  if (!apolloKey) apolloKey = getSecret('apollo_key')
  return apolloKey
}

function getSecret(secretName: string): string | undefined {
  const secretPath = join('/etc/secrets', secretName)
  if (existsSync(secretPath)) {
    readFile(secretPath, { encoding: 'utf-8' }, function (err, data) {
      if (err) throw new MisconfiguredSecretError(`${secretPath} could not be read`)
      return data
    })
  } else if (process.env[secretName.toUpperCase()]) {
    return process.env[secretName.toUpperCase()]
  } else {
    throw new MisconfiguredSecretError(
      `Neither ${secretPath} or ${secretName.toUpperCase()} env var were configured`
    )
  }
}
