import { MisconfiguredSecretError } from '@/modules/shared/errors'
import { existsSync, readFile } from 'fs'
import { join } from 'path'

let redisUrl: string
let postgresUrl: string
let sessionSecret: string
let emailPassword: string
let s3SecretKey: string
let googleClientSecret: string
let githubClientSecret: string
let azureADClientSecret: string
let apolloKey: string

export function getRedisUrl(): string {
  if (!redisUrl) redisUrl = getSecret('redis_url')
  return redisUrl
}

export function getPostgresUrl(): string {
  if (!postgresUrl) postgresUrl = getSecret('postgres_url')
  return postgresUrl
}

export function getSessionSecret(): string {
  if (!sessionSecret) sessionSecret = getSecret('session_secret')
  return sessionSecret
}

export function getEmailPassword(): string {
  if (!emailPassword) emailPassword = getSecret('email_password')
  return emailPassword
}

export function getS3SecretKey(): string {
  if (!s3SecretKey) s3SecretKey = getSecret('s3_secret_key')
  return s3SecretKey
}

export function getGoogleClientSecret(): string {
  if (!googleClientSecret) googleClientSecret = getSecret('google_client_secret')
  return googleClientSecret
}

export function getGitHubClientSecret(): string {
  if (!githubClientSecret) githubClientSecret = getSecret('github_client_secret')
  return githubClientSecret
}

export function getAzureADClientSecret(): string {
  if (!azureADClientSecret) azureADClientSecret = getSecret('azure_ad_client_secret')
  return azureADClientSecret
}

export function getApolloKey(): string {
  if (!apolloKey) apolloKey = getSecret('apollo_key')
  return apolloKey
}

function getSecret(secretName: string): string {
  const secretPath = join('/etc/secrets', secretName)
  if (existsSync(secretPath)) {
    readFile(secretPath, { encoding: 'utf-8' }, function (err, data) {
      if (!err) return data
    })
  }

  if (process.env[secretName.toUpperCase()]) {
    return process.env[secretName.toUpperCase()] ?? ''
  }

  throw new MisconfiguredSecretError(
    `Neither ${secretPath} or ${secretName.toUpperCase()} env var were configured`
  )
}
