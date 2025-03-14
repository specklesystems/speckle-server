import fs from 'fs'
import path from 'node:path'
import { Writable } from 'node:stream'
import { stream, fetch } from 'undici'

export async function downloadFile({
  fileId,
  streamId,
  token,
  destination
}: {
  fileId: string
  streamId: string
  token: string
  destination: string
}) {
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  await stream(
    `${process.env.SPECKLE_SERVER_URL}/api/stream/${streamId}/blob/${fileId}`,
    {
      method: 'GET',
      opaque: fs.createWriteStream(destination),
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    ({ opaque }) => opaque as Writable //FIXME
  )
}
export async function getFileInfoByName({
  fileName,
  streamId,
  token
}: {
  fileName: string
  streamId: string
  token: string
}) {
  const response = await fetch(
    `${process.env.SPECKLE_SERVER_URL}/api/stream/${streamId}/blobs?fileName=${fileName}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  return response.json() as Promise<{ blobs: { id: string }[] }>
}
