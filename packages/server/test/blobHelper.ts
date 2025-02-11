import request from 'supertest'
import { Express } from 'express'

/**
 * Upload a blob from a test runner
 */
export async function uploadBlob(
  app: Express,
  filePath: string,
  streamId: string,
  auth: { authToken: string }
) {
  const response = await request(app)
    .post(`/api/stream/${streamId}/blob`)
    .attach('file', filePath)
    .set('Accept', 'application/json')
    .set('Authorization', auth.authToken ? `Bearer ${auth.authToken}` : '')

  const uploadResults = response.body.uploadResults || []
  if (!uploadResults.length) {
    throw new Error('Test runner blob upload received unexpected results!')
  }

  return uploadResults[0] as Record<string, unknown> & { blobId: string }
}

export type UploadedBlob = Awaited<ReturnType<typeof uploadBlob>>
