import {
  getS3AccessKey,
  getS3BucketName,
  getS3Endpoint,
  getS3Region,
  getS3SecretKey
} from '@/modules/shared/helpers/envHelper'
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { Optional } from '@speckle/shared'

export type ObjectStorage = {
  client: S3Client
  bucket: string
}

export type GetObjectStorageParams = {
  credentials: S3ClientConfig['credentials']
  endpoint: S3ClientConfig['endpoint']
  region: S3ClientConfig['region']
  bucket: string
}

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
