import { randomInt } from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'

const saveUploadFile = saveUploadFileFactory({ db })
export const createFileUploadJob = (params: { projectId: string; userId: string }) => {
  const { projectId, userId } = params
  const jobId = cryptoRandomString({ length: 10 })
  const data = {
    fileId: jobId,
    streamId: projectId,
    branchName: cryptoRandomString({ length: 10 }),
    userId,
    fileName: cryptoRandomString({ length: 10 }),
    fileType: cryptoRandomString({ length: 3 }),
    fileSize: randomInt(1, 1e6)
  }

  return saveUploadFile(data)
}
