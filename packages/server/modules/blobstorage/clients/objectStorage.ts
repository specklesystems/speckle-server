import {
  getS3AccessKey,
  getS3BucketName,
  getS3Endpoint,
  getS3PublicEndpoint,
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

export type GetProjectObjectStorage = (args: {
  projectId: string
}) => Promise<ObjectStorage>

export type GetObjectStorageParams = {
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  endpoint: string
  region: string
  bucket: string
}

export type ObjectStorage = {
  client: S3Client
  bucket: string
  params: GetObjectStorageParams
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
  return { client, bucket, params }
}

let mainObjectStorage: Optional<ObjectStorage> = undefined
let publicMainObjectStorage: Optional<ObjectStorage> = undefined

/**
 * Get main object storage client
 *
 * This is used for connecting the server to the S3 host. Where the S3 host is
 * on the same private network as the server (e.g. in a Docker network),
 * the S3_ENDPOINT can use the private IP or DNS name of the S3 host.
 *
 * S3_PUBLIC_ENDPOINT can be used to connect to the S3 host via the
 * public internet (or localhost network if running locally or testing).
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
 * (Optional) Used to connect to the S3 host via the public endpoint.
 * This is useful for clients that need to access the S3 bucket directly, e.g
 * during testing or when the S3 host is not on the same private network as the server.
 *
 * If `S3_PUBLIC_ENDPOINT` is not set, it will return the same object storage
 * as `getMainObjectStorage`.
 */
export const getPublicMainObjectStorage = (): ObjectStorage => {
  if (publicMainObjectStorage) return publicMainObjectStorage

  const endpoint = getS3PublicEndpoint()
  if (!endpoint) {
    // If no public endpoint is set, return the main object storage
    return getMainObjectStorage()
  }

  const mainParams: GetObjectStorageParams = {
    credentials: {
      accessKeyId: getS3AccessKey(),
      secretAccessKey: getS3SecretKey()
    },
    endpoint,
    region: getS3Region(),
    bucket: getS3BucketName()
  }

  publicMainObjectStorage = getObjectStorage(mainParams)
  return publicMainObjectStorage
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
