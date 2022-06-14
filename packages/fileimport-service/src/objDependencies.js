'use strict'
const events = require('events')
const fs = require('fs')
const readline = require('readline')
const path = require('path')

const { downloadFile, getFileInfoByName } = require('./filesApi')
const isValidFilename = require('valid-filename')

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
    console.error(`Error getting dependencies for file ${objFilePath}: ${err}`)
  }
  return mtlFiles
}

module.exports = {
  async downloadDependencies({ objFilePath, streamId, destinationDir, token }) {
    const dependencies = await getReferencedMtlFiles({ objFilePath })

    console.log(`Obj file depends on ${dependencies}`)
    for (const mtlFile of dependencies) {
      // there might be multiple files named with the same name, take the first...
      const [file] = (await getFileInfoByName({ fileName: mtlFile, streamId, token }))
        .blobs
      if (!file) {
        console.log(`OBJ dependency file not found in stream: ${mtlFile}`)
        continue
      }
      if (!isValidFilename(mtlFile)) {
        console.log(`Invalid filename reference in OBJ dependencies: ${mtlFile}`)
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
