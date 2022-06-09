/* istanbul ignore file */
'use strict'

const knex = require('@/db/knex')
const S3 = require('aws-sdk/clients/s3')

const FileUploads = () => knex('file_uploads')

function getS3Config() {
  return {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
    s3ForcePathStyle: true,
    signatureVersion: 'v4'
  }
}

module.exports = {
  async checkBucket() {
    const s3 = new S3(getS3Config())
    const Bucket = process.env.S3_BUCKET

    try {
      await s3.headBucket({ Bucket }).promise()
      return
    } catch (err) {
      if (err.statusCode === 403) {
        throw new Error('Access denied to S3 bucket ')
      }
      if (process.env.S3_CREATE_BUCKET === 'true') {
        await s3.createBucket({ Bucket }).promise()
      } else {
        throw new Error(`Can't open S3 bucket '${Bucket}': ${err.toString()}`)
      }
    }
  },

  async getFileInfo({ fileId }) {
    const fileInfo = await FileUploads().where({ id: fileId }).select('*').first()
    return fileInfo
  },

  async getStreamFileUploads({ streamId }) {
    const fileInfos = await FileUploads()
      .where({ streamId })
      .select('*')
      .orderBy([{ column: 'uploadDate', order: 'desc' }])
    return fileInfos
  },

  async getFileStream({ fileId }) {
    const s3 = new S3(getS3Config())
    const Bucket = process.env.S3_BUCKET
    const Key = `files/${fileId}`

    const fileStream = s3.getObject({ Key, Bucket }).createReadStream()
    return fileStream
  },

  async startUploadFile({ fileId, streamId, branchName, userId, fileName, fileType }) {
    // Create ID and db entry
    const dbFile = {
      id: fileId,
      streamId,
      branchName,
      userId,
      fileName,
      fileType
    }
    await FileUploads().insert(dbFile)

    // Upload stream
    // const s3 = new S3(getS3Config())
    // const Bucket = process.env.S3_BUCKET
    // TODO: error if missing
    // const Key = `files/${fileId}`

    // await s3.upload({ Bucket, Key, Body: fileStream }).promise()

    return fileId
  },

  async finishUploadFile({ fileId, fileSize }) {
    // TODO: error if missing

    // Get file size and update db entry

    //somehow get the file checksum, its supposed to be on an http trailer value
    await FileUploads().where({ id: fileId }).update({ uploadComplete: true, fileSize })
  }
}
