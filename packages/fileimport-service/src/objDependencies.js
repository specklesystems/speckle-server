'use strict'
const events = require('events')
const fs = require('fs')
const readline = require('readline')
const path = require('path')

const { downloadFile, getFileInfoByName } = require('./filesApi')
const isValidFilename = require('valid-filename')
const { logger } = require('../observability/logging')

const getReferencedMtlFiles = async ({ objFilePath }) => {
  const mtlFiles = []

  try {
    const rl = readline.createInterface({
      input: fs.createReadStream(objFilePath),
      crlfDelay: Infinity
    })

    rl.on('line', (line) => {
      if (line.startsWith('mtllib ')) {
        const mtlFile = line.slice('mtllib '.length).trim()
        mtlFiles.push(mtlFile)
      }
    })

    await events.once(rl, 'close')
  } catch (err) {
    logger.error(err, `Error getting dependencies for file ${objFilePath}`)
  }
  return mtlFiles
}

module.exports = {
  async downloadDependencies({ objFilePath, streamId, destinationDir, token }) {
    const dependencies = await getReferencedMtlFiles({ objFilePath })

    logger.info(`Obj file depends on ${dependencies}`)
    for (const mtlFile of dependencies) {
      // there might be multiple files named with the same name, take the first...
      const [file] = (await getFileInfoByName({ fileName: mtlFile, streamId, token }))
        .blobs
      if (!file) {
        logger.info(`OBJ dependency file not found in stream: ${mtlFile}`)
        continue
      }
      if (!isValidFilename(mtlFile)) {
        logger.warn(`Invalid filename reference in OBJ dependencies: ${mtlFile}`)
        continue
      }
      await downloadFile({
        fileId: file.id,
        streamId,
        token,
        destination: path.join(destinationDir, mtlFile)
      })
    }
  }
}
