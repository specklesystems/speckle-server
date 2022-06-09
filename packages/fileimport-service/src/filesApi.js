/* istanbul ignore file */
'use strict'
const fs = require('fs')
const path = require('node:path')
const { fetch } = require('undici')
const { Readable } = require('node:stream')

const getFileStream = async ({ fileId, streamId, token }) => {
  const response = await fetch(
    `http://localhost:3000/api/stream/${streamId}/blob/${fileId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return Readable.from(response.body)
}
module.exports = {
  async downloadFile({ fileId, streamId, token, destination }) {
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    const upstreamFileStream = await getFileStream({ fileId, streamId, token })
    const diskFileStream = fs.createWriteStream(destination)
    upstreamFileStream.pipe(diskFileStream)

    await new Promise((resolve) => diskFileStream.on('finish', resolve))
  }
}
