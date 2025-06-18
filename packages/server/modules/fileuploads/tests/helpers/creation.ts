import { randomInt } from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { FileImportMessage } from '@/modules/fileuploads/domain/operations'
import { assign } from 'lodash'

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
    fileSize: randomInt(1, 1e6),
    modelId: null
  }

  return saveUploadFile(data)
}

export const buildFileUploadMessage = (
  override: Partial<FileImportMessage> = {}
): FileImportMessage => {
  const defaults: FileImportMessage = {
    modelId: cryptoRandomString({ length: 10 }),
    projectId: cryptoRandomString({ length: 10 }),
    fileType: cryptoRandomString({ length: 10 }),
    fileName: cryptoRandomString({ length: 10 }),
    blobId: cryptoRandomString({ length: 10 }),
    userId: cryptoRandomString({ length: 10 }),
    jobId: cryptoRandomString({ length: 10 })
  }

  return assign(defaults, override)
}
