/* istanbul ignore file */
'use strict'

const knex = require('@/db/knex')

const FileUploads = () => knex('file_uploads')

module.exports = {
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

  async saveUploadFile({
    fileId,
    streamId,
    branchName,
    userId,
    fileName,
    fileType,
    fileSize
  }) {
    const dbFile = {
      id: fileId,
      streamId,
      branchName,
      userId,
      fileName,
      fileType,
      fileSize,
      uploadComplete: true
    }
    await FileUploads().insert(dbFile)
  }
}
