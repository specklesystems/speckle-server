const { logger } = require('@/logging/logging')
const { NotFoundError } = require('@/modules/shared/errors')
const {
  S3Client,
  GetObjectCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  S3ServiceException
} = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')

let s3Config = null

const getS3Config = () => {
  if (!s3Config) {
    if (!process.env.S3_ACCESS_KEY)
      throw new Error('Config value S3_ACCESS_KEY is missing')
    if (!process.env.S3_SECRET_KEY)
      throw new Error('Config value S3_SECRET_KEY is missing')
    if (!process.env.S3_ENDPOINT) throw new Error('Config value S3_ENDPOINT is missing')
    s3Config = {
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
      },
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
      // s3ForcePathStyle: true,
      // signatureVersion: 'v4',
      region: process.env.S3_REGION || 'us-east-1'
    }
  }
  return s3Config
}

let storageBucket = null

const getStorageBucket = () => {
  if (!storageBucket) {
    if (!process.env.S3_BUCKET) throw new Error('Config value S3_BUCKET is missing')
    storageBucket = process.env.S3_BUCKET
  }
  return storageBucket
}

const getObjectStorage = () => ({
  client: new S3Client(getS3Config()),
  Bucket: getStorageBucket(),
  createBucket: process.env.S3_CREATE_BUCKET || false
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
    // await this._client.send(new HeadBucketCommand({ Bucket: this._bucket }))
    await client.send(new HeadBucketCommand({ Bucket }))
    return
  } catch (err) {
    if (err.statusCode === 403) {
      throw new Error('Access denied to S3 bucket ')
    }
    if (createBucket) {
      try {
        await client.send(new CreateBucketCommand({ Bucket }))
      } catch (err) {
        logger.error(err)
      }
    } else {
      throw new Error(`Can't open S3 bucket '${Bucket}': ${err.toString()}`)
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
