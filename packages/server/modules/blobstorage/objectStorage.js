const { NotFoundError, EnvironmentResourceError } = require('@/modules/shared/errors')
const {
  S3Client,
  GetObjectCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  S3ServiceException
} = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const {
  getS3AccessKey,
  getS3SecretKey,
  getS3Endpoint,
  getS3Region,
  getS3BucketName,
  createS3Bucket
} = require('@/modules/shared/helpers/envHelper')

let s3Config = null

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

let storageBucket = null

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

const sendCommand = async (command) => {
  const { client, Bucket } = getObjectStorage()
  try {
    return await client.send(command(Bucket))
  } catch (err) {
    if (err instanceof S3ServiceException && err.Code === 'NoSuchKey')
      throw new NotFoundError(err.message)
    throw err
  }
}

const getObjectStream = async ({ objectKey }) => {
  const data = await sendCommand(
    (Bucket) => new GetObjectCommand({ Bucket, Key: objectKey })
  )
  return data.Body
}

const getObjectAttributes = async ({ objectKey }) => {
  const data = await sendCommand(
    (Bucket) => new GetObjectCommand({ Bucket, Key: objectKey })
  )
  return { fileSize: data.ContentLength }
}

const storeFileStream = async ({ objectKey, fileStream }) => {
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

  // parallelUploads3.on('httpUploadProgress', (progress) => {
  //   logger.debug(progress)
  // })

  const data = await parallelUploads3.done()
  // the ETag is a hash of the object. Could be used to dedupe stuff...
  const fileHash = data.ETag.replaceAll('"', '')
  return { fileHash }
}

const deleteObject = async ({ objectKey }) => {
  await sendCommand((Bucket) => new DeleteObjectCommand({ Bucket, Key: objectKey }))
}
const ensureStorageAccess = async () => {
  const { client, Bucket, createBucket } = getObjectStorage()
  try {
    await client.send(new HeadBucketCommand({ Bucket }))
    return
  } catch (err) {
    if (err.statusCode === 403 || err['$metadata']?.httpStatusCode === 403) {
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
            cause: err,
            info: { bucket: Bucket }
          }
        )
      }
    } else {
      throw new EnvironmentResourceError(
        "Can't open S3 bucket '{bucket}', and the Speckle server configuration has disabled creation of the bucket.",
        {
          cause: err,
          info: { bucket: Bucket }
        }
      )
    }
  }
}

module.exports = {
  ensureStorageAccess,
  deleteObject,
  getObjectAttributes,
  storeFileStream,
  getObjectStream
}
