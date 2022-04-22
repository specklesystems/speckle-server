'use strict'
const events = require('events')
const fs = require('fs')
const readline = require('readline')
const path = require('path')

const { getFileInfoByName } = require('./filesMetadata')
const { getFileStream } = require('./filesApi')

const isValidFilename = require('valid-filename')

async function tryDownloadFile({ fileName, streamId, destinationDir }) {
  if (!isValidFilename(fileName)) {
    console.log(`Invalid filename reference in OBJ dependencies: ${fileName}`)
    return false
  }

  const fileInfo = await getFileInfoByName({ streamId, fileName })
  if (!fileInfo) {
    console.log(`OBJ dependency file not found in stream: ${fileName}`)
    return false
  }

  const filePath = path.join(destinationDir, fileName)
  const upstreamFileStream = await getFileStream({ fileId: fileInfo.fileId })
  const diskFileStream = fs.createWriteStream(filePath)

  upstreamFileStream.pipe(diskFileStream)
  await new Promise((fulfill) => diskFileStream.on('finish', fulfill))
  return true
}

module.exports = {
  async getReferencedMtlFiles({ objFilePath }) {
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
      console.error(`Error getting dependencies for file ${objFilePath}: ${err}`)
    }
    return mtlFiles
  },

  async downloadDependencies({ objFilePath, streamId, destinationDir }) {
    const dependencies = await this.getReferencedMtlFiles({ objFilePath })
    console.log(`Obj file depends on ${dependencies}`)
    for (const mtlFile of dependencies) {
      await tryDownloadFile({ fileName: mtlFile, streamId, destinationDir })
    }
  }
}
