import events from 'events'
import fs from 'fs'
import readline from 'readline'
import path from 'path'
import isValidFilename from 'valid-filename'

import { downloadFile, getFileInfoByName } from '@/controller/filesApi.js'
import { logger } from '@/observability/logging.js'

const getReferencedMtlFiles = async ({ objFilePath }: { objFilePath: string }) => {
  const mtlFiles: string[] = []

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

export async function downloadDependencies({
  objFilePath,
  streamId,
  destinationDir,
  token
}: {
  objFilePath: string
  streamId: string
  destinationDir: string
  token: string
}) {
  const dependencies = await getReferencedMtlFiles({ objFilePath })

  logger.info(`Obj file depends on ${dependencies.join(', ')}`)
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
