import {
  getS3AccessKey,
  getS3BucketName,
  getS3Endpoint,
  getS3Region,
  getS3SecretKey
} from '@/modules/shared/helpers/envHelper'
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig
} from '@aws-sdk/client-s3'
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { Optional } from '@speckle/shared'
import {
  GetBlobMetadataFromStorage,
  GetSignedUrl
} from '@/modules/blobstorage/domain/operations'

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

export const getSignedUrlFactory = (deps: {
  objectStorage: ObjectStorage
}): GetSignedUrl => {
  const { objectStorage } = deps
  const { client, bucket } = objectStorage
  return async (params) => {
    const { objectKey, urlExpiryDurationSeconds } = params
    const command = new PutObjectCommand({ Bucket: bucket, Key: objectKey })
    return s3GetSignedUrl(client, command, { expiresIn: urlExpiryDurationSeconds })
  }
}

export const getBlobMetadataFromStorage = (deps: {
  objectStorage: ObjectStorage
}): GetBlobMetadataFromStorage => {
  const { objectStorage } = deps
  const { client, bucket } = objectStorage

  return async (params) => {
    const { objectKey } = params

    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/command/HeadObjectCommand/
    const headObjectCommand = new HeadObjectCommand({ Bucket: bucket, Key: objectKey })
    const metadata = await client.send(headObjectCommand)
    return {
      contentLength: metadata.ContentLength,
      eTag: metadata.ETag
    }
  }
}
