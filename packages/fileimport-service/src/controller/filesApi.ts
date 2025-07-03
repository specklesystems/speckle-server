import { ensureError } from '@speckle/shared'
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
  const boundLogger = logger.child({
    fileId,
    streamId
  })
  try {
    fs.mkdirSync(path.dirname(destination), { recursive: true })
  } catch (e) {
    throw ensureError(e, 'Unknown error while creating directory')
  }

  const downloadUrl = new URL(
    `/api/stream/${streamId}/blob/${fileId}`,
    speckleServerUrl
  )

  boundLogger.info(
    { destinationFile: destination, downloadUrl: downloadUrl.toString() },
    'Downloading file {fileId} (project: {streamId}) from {downloadUrl} to {destinationFile}'
  )

  let response
  const tokenId = token.substring(0, 10)
  try {
    response = await fetch(downloadUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (e) {
    throw new Error(
      `Error while fetching file ${fileId} from ${downloadUrl.toString()} with token ID ${tokenId}. Message: ${
        e instanceof Error ? e.message : String(e)
      }`,
      {
        cause: e
      }
    )
  }

  if (response === undefined || !response.ok) {
    boundLogger.error(
      {
        downloadUrl: downloadUrl.toString(),
        tokenId,
        status: response?.status,
        statusText: response?.statusText
      },
      "Failed to download file '{fileId}' from '{downloadUrl}' with token ID '{tokenId}'. HTTP {status}: {statusText}"
    )
    throw new Error(
      `Failed to download file '${fileId}' from '${downloadUrl.toString()}' with token ID '${tokenId}'. HTTP ${
        response?.status
      }: ${response?.statusText}`
    )
  }
  if (!response.body) {
    throw new Error('Response body is undefined')
  }

  const writer = fs.createWriteStream(destination)

  //handle errors
  writer.on('error', (err) => {
    boundLogger.error(ensureError(err), `Error writing file ${destination}`)
    throw err
  })

  //handle completion
  writer.on('finish', () => {
    boundLogger.info(`File written to ${destination}`)
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
  const fileInfoUrl = new URL(
    `/api/stream/${streamId}/blobs?fileName=${fileName}`,
    speckleServerUrl
  )
  const response = await fetch(fileInfoUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return response.json() as Promise<{ blobs: { id: string }[] }>
}
