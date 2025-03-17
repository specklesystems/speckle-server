import { ensureError } from '@speckle/shared/dist/esm/index.js'
import fs from 'fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Logger } from 'pino'

export async function downloadFile({
  speckleServerUrl,
  fileId,
  streamId,
  token,
  destination,
  logger
}: {
  speckleServerUrl: string
  fileId: string
  streamId: string
  token: string
  destination: string
  logger: Logger
}) {
  try {
    fs.mkdirSync(path.dirname(destination), { recursive: true })
  } catch (e) {
    throw ensureError(e, 'Unknown error while creating directory')
  }

  logger.info(
    { destinationFile: destination },
    'Downloading file {fileId} from {streamId} to {destinationFile}'
  )

  let response
  try {
    response = await fetch(
      `${speckleServerUrl}/api/stream/${streamId}/blob/${fileId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
  } catch (e) {
    throw ensureError(e, 'Unknown error while fetching file')
  }

  if (response === undefined || !response.ok) {
    logger.error(
      { status: response?.status, statusText: response?.statusText },
      'Failed to download file {fileId}. HTTP {status}: {statusText}'
    )
    throw new Error(
      `Failed to download file ${fileId}. HTTP ${response?.status}: ${response?.statusText}`
    )
  }
  if (!response.body) {
    throw new Error('Response body is undefined')
  }

  const writer = fs.createWriteStream(destination)

  //handle errors
  writer.on('error', (err) => {
    logger.error(ensureError(err), `Error writing file ${destination}`)
    throw err
  })

  //handle completion
  writer.on('finish', () => {
    logger.info(`File written to ${destination}`)
  })

  await pipeline(response.body, writer, { end: true })
}
export async function getFileInfoByName({
  speckleServerUrl,
  fileName,
  streamId,
  token
}: {
  speckleServerUrl: string
  fileName: string
  streamId: string
  token: string
}) {
  const response = await fetch(
    `${speckleServerUrl}/api/stream/${streamId}/blobs?fileName=${fileName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.json() as Promise<{ blobs: { id: string }[] }>
}
