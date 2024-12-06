import { ObjectStorage } from '@/modules/blobstorage/clients/objectStorage'
import {
  DeleteObject,
  EnsureStorageAccess,
  GetObjectAttributes,
  GetObjectStream,
  StoreFileStream
} from '@/modules/blobstorage/domain/storageOperations'
import {
  BadRequestError,
  EnvironmentResourceError,
  NotFoundError
} from '@/modules/shared/errors'
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  S3ServiceException,
  ServiceOutputTypes
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import type { Command } from '@aws-sdk/smithy-client'
import { ensureError } from '@speckle/shared'
import { get } from 'lodash'
import type stream from 'stream'

const sendCommand = async <CommandOutput extends ServiceOutputTypes>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: Command<any, CommandOutput, any, any, any>,
  storage: ObjectStorage
) => {
  const { client } = storage
  try {
    const ret = await client.send(command)
    return ret
  } catch (err) {
    if (err instanceof S3ServiceException && get(err, 'Code') === 'NoSuchKey')
      throw new NotFoundError(err.message)
    throw err
  }
}

export const getObjectStreamFactory =
  (deps: { storage: ObjectStorage }): GetObjectStream =>
  async ({ objectKey }) => {
    const { storage } = deps
    const data = await sendCommand(
      new GetObjectCommand({ Bucket: storage.bucket, Key: objectKey }),
      storage
    )

    // Apparently not always stream.Readable according to types, but in practice it always is
    return data.Body as stream.Readable
  }

export const getObjectAttributesFactory =
  (deps: { storage: ObjectStorage }): GetObjectAttributes =>
  async ({ objectKey }) => {
    const { storage } = deps
    const data = await sendCommand(
      new GetObjectCommand({ Bucket: storage.bucket, Key: objectKey }),
      storage
    )

    return { fileSize: data.ContentLength || 0 }
  }

export const storeFileStreamFactory =
  (deps: { storage: ObjectStorage }): StoreFileStream =>
  async ({ objectKey, fileStream }) => {
    const {
      storage: { client, bucket: Bucket }
    } = deps

    const upload = new Upload({
      client,
      params: { Bucket, Key: objectKey, Body: fileStream },
      tags: [
        /*...*/
      ], // optional tags
      queueSize: 4, // optional concurrency configuration
      partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
      leavePartsOnError: false // optional manually handle dropped parts
    })

    const data = await upload.done()
    // the ETag is a hash of the object. Could be used to dedupe stuff...

    if (!data || !('ETag' in data) || !data.ETag) {
      throw new BadRequestError('No ETag in response')
    }

    const fileHash = data.ETag.replaceAll('"', '')
    return { fileHash }
  }

export const deleteObjectFactory =
  (deps: { storage: ObjectStorage }): DeleteObject =>
  async ({ objectKey }) => {
    await sendCommand(
      new DeleteObjectCommand({ Bucket: deps.storage.bucket, Key: objectKey }),
      deps.storage
    )
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

export const ensureStorageAccessFactory =
  (deps: { storage: ObjectStorage }): EnsureStorageAccess =>
  async ({ createBucketIfNotExists }) => {
    const { client, bucket: Bucket } = deps.storage
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
      if (createBucketIfNotExists) {
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
