import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { regionConfigSchema } from './db.js'

describe('Database Configuration', () => {
  let baseNodeEnv: string

  beforeAll(() => {
    baseNodeEnv = process.env.NODE_ENV || ''
  })

  afterEach(() => {
    process.env.NODE_ENV = baseNodeEnv
  })

  it('regionConfigSchema does not allow skipInitialization in non-test environments', () => {
    const validConfig = {
      postgres: {
        connectionUri: 'postgres://user:password@host:port/dbname',
        databaseName: 'dbname',
        privateConnectionUri: 'postgres://user:password@host:port/dbname',
        publicTlsCertificate: 'cert',
        skipInitialization: false
      },
      blobStorage: {
        endpoint: 'https://s3.example.com',
        publicEndpoint: 'https://public.s3.example.com',
        accessKey: 'accessKey',
        secretKey: 'secretKey',
        bucket: 'bucketName',
        createBucketIfNotExists: true,
        s3Region: 'us-west-1'
      }
    }

    process.env.NODE_ENV = 'test' // this should work
    expect(() => regionConfigSchema.parse(validConfig)).not.toThrow()

    const invalidConfig = {
      ...validConfig,
      postgres: { ...validConfig.postgres, skipInitialization: true }
    }

    process.env.NODE_ENV = 'production' // this should throw
    expect(() => regionConfigSchema.parse(invalidConfig)).toThrow(
      /skipInitialization can only be set when NODE_ENV is \\\"test\\\"/
    )
  })
})
