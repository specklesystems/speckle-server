/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NotFoundError,
  EnvironmentResourceError,
  BadRequestError
} from '@/modules/shared/errors'
import {
  S3Client,
  GetObjectCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  S3ServiceException,
  S3ClientConfig,
  ServiceOutputTypes
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import {
  getS3AccessKey,
  getS3SecretKey,
  getS3Endpoint,
  getS3Region,
  getS3BucketName,
  createS3Bucket
} from '@/modules/shared/helpers/envHelper'
import { ensureError, Nullable } from '@speckle/shared'
import { get } from 'lodash'
import type { Command } from '@aws-sdk/smithy-client'
import type stream from 'stream'
import { StoreFileStream } from '@/modules/blobstorage/domain/operations'

let s3Config: Nullable<S3ClientConfig> = null

const getS3Config = () => {
  if (!s3Config) {
    s3Config = {
      credentials: {
        accessKeyId: getS3AccessKey(),
        secretAccessKey: getS3SecretKey()
      },
      endpoint: getS3Endpoint(),
      forcePathStyle: true,
      // s3ForcePathStyle: true,
      // signatureVersion: 'v4',
      region: getS3Region()
    }
  }
  return s3Config
}

let storageBucket: Nullable<string> = null

const getStorageBucket = () => {
  if (!storageBucket) {
    storageBucket = getS3BucketName()
  }
  return storageBucket
}

const getObjectStorage = () => ({
  client: new S3Client(getS3Config()),
  Bucket: getStorageBucket(),
  createBucket: createS3Bucket()
})

const sendCommand = async <CommandOutput extends ServiceOutputTypes>(
  command: (Bucket: string) => Command<any, CommandOutput, any, any, any>
) => {
  const { client, Bucket } = getObjectStorage()
  try {
    const ret = await client.send(command(Bucket))
    return ret
  } catch (err) {
    if (err instanceof S3ServiceException && get(err, 'Code') === 'NoSuchKey')
      throw new NotFoundError(err.message)
    throw err
  }
}

export const getObjectStream = async ({ objectKey }: { objectKey: string }) => {
  const data = await sendCommand(
    (Bucket) => new GetObjectCommand({ Bucket, Key: objectKey })
  )

  // TODO: Apparently not always stream.Readable according to types, but in practice this works
  return data.Body as stream.Readable
}

export const getObjectAttributes = async ({ objectKey }: { objectKey: string }) => {
  const data = await sendCommand(
    (Bucket) => new GetObjectCommand({ Bucket, Key: objectKey })
  )
  return { fileSize: data.ContentLength || 0 }
}

export const storeFileStream: StoreFileStream = async ({ objectKey, fileStream }) => {
  const { client, Bucket } = getObjectStorage()
  const parallelUploads3 = new Upload({
    client,
    params: { Bucket, Key: objectKey, Body: fileStream },
    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })

  const data = await parallelUploads3.done()
  // the ETag is a hash of the object. Could be used to dedupe stuff...

  if (!data || !('ETag' in data) || !data.ETag) {
    throw new BadRequestError('No ETag in response')
  }

  const fileHash = data.ETag.replaceAll('"', '')
  return { fileHash }
}

export const deleteObject = async ({ objectKey }: { objectKey: string }) => {
  await sendCommand((Bucket) => new DeleteObjectCommand({ Bucket, Key: objectKey }))
}

// No idea what the actual error type is, too difficult to figure out
type EnsureStorageAccessError = Error & {
  statusCode?: number
  $metadata?: { httpStatusCode?: number }
}

const isExpectedEnsureStorageAccessError = (
  err: unknown
): err is EnsureStorageAccessError =>
  err instanceof Error && ('statusCode' in err || '$metadata' in err)

export const ensureStorageAccess = async () => {
  const { client, Bucket, createBucket } = getObjectStorage()
  try {
    await client.send(new HeadBucketCommand({ Bucket }))
    return
  } catch (err) {
    if (
      isExpectedEnsureStorageAccessError(err) &&
      (err.statusCode === 403 || err['$metadata']?.httpStatusCode === 403)
    ) {
      throw new EnvironmentResourceError("Access denied to S3 bucket '{bucket}'", {
        cause: err,
        info: { bucket: Bucket }
      })
    }
    if (createBucket) {
      try {
        await client.send(new CreateBucketCommand({ Bucket }))
      } catch (err) {
        throw new EnvironmentResourceError(
          "Can't open S3 bucket '{bucket}', and have failed to create it.",
          {
            cause: ensureError(err),
            info: { bucket: Bucket }
          }
        )
      }
    } else {
      throw new EnvironmentResourceError(
        "Can't open S3 bucket '{bucket}', and the Speckle server configuration has disabled creation of the bucket.",
        {
          cause: ensureError(err),
          info: { bucket: Bucket }
        }
      )
    }
  }
}
