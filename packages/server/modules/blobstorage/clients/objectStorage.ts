import {
  getS3AccessKey,
  getS3BucketName,
  getS3Endpoint,
  getS3Region,
  getS3SecretKey
} from '@/modules/shared/helpers/envHelper'
import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Optional } from '@speckle/shared'

//FIXME these types should move to domain directory, except we want to avoid having a dependency on S3Client from the domain
export type ObjectStorage = {
  client: S3Client
  bucket: string
}

export type GetProjectObjectStorage = (args: {
  projectId: string
}) => Promise<ObjectStorage>

export type GetObjectStorageParams = {
  credentials: S3ClientConfig['credentials']
  endpoint: S3ClientConfig['endpoint']
  region: S3ClientConfig['region']
  bucket: string
}

export type GetSignedUrl = (params: {
  objectStorage: ObjectStorage
  objectKey: string
  urlExpiryDurationSeconds: number
}) => Promise<string>

/**
 * Get object storage client
 */
export const getObjectStorage = (params: GetObjectStorageParams): ObjectStorage => {
  const { bucket, credentials, endpoint, region } = params

  const config: S3ClientConfig = {
    credentials,
    endpoint,
    region,
    forcePathStyle: true
  }
  const client = new S3Client(config)
  return { client, bucket }
}

let mainObjectStorage: Optional<ObjectStorage> = undefined

/**
 * Get main object storage client
 */
export const getMainObjectStorage = (): ObjectStorage => {
  if (mainObjectStorage) return mainObjectStorage

  const mainParams: GetObjectStorageParams = {
    credentials: {
      accessKeyId: getS3AccessKey(),
      secretAccessKey: getS3SecretKey()
    },
    endpoint: getS3Endpoint(),
    region: getS3Region(),
    bucket: getS3BucketName()
  }

  mainObjectStorage = getObjectStorage(mainParams)
  return mainObjectStorage
}

/**
 * For project-specific object storage, use the equivalent from the multiregion module.
 * This function is intended to maintain compatibility where multiregion is disabled.
 * @returns Main object storage client, ignoring parameters
 */
export const getProjectObjectStorage: GetProjectObjectStorage =
  async (/* purposefully ignoring parameters */) => {
    return getMainObjectStorage()
  }

export const getSignedUrl: GetSignedUrl = async (params) => {
  const { objectStorage, objectKey, urlExpiryDurationSeconds } = params
  const { client, bucket } = objectStorage
  const command = new PutObjectCommand({ Bucket: bucket, Key: objectKey })
  return s3GetSignedUrl(client, command, { expiresIn: urlExpiryDurationSeconds })
}
