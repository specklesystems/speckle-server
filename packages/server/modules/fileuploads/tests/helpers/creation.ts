import { randomInt } from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import type { FileImportMessage } from '@/modules/fileuploads/domain/operations'
import { assign } from 'lodash-es'
import type {
  FileUploadRecord,
  FileUploadRecordV2
} from '@/modules/fileuploads/helpers/types'
import { FileUploadConvertedStatus } from '@speckle/shared/blobs'

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

export const buildFileUploadRecord = (
  overrides: Partial<FileUploadRecord & FileUploadRecordV2>
): FileUploadRecord & FileUploadRecordV2 => {
  const id =
    overrides.projectId || overrides.streamId || cryptoRandomString({ length: 10 })
  const defaults: FileUploadRecord & FileUploadRecordV2 = {
    id: cryptoRandomString({ length: 10 }),
    branchName: cryptoRandomString({ length: 10 }),
    convertedStatus: FileUploadConvertedStatus.Completed,
    metadata: null,
    convertedCommitId: cryptoRandomString({ length: 10 }),
    convertedLastUpdate: new Date(),
    convertedMessage: null,
    uploadDate: new Date(),
    uploadComplete: false,
    projectId: id,
    streamId: id,
    fileName: cryptoRandomString({ length: 10 }),
    fileType: cryptoRandomString({ length: 10 }),
    fileSize: randomInt(1, 1e6),
    userId: cryptoRandomString({ length: 10 }),
    modelId: cryptoRandomString({ length: 10 }),
    performanceData: null
  }

  return assign(defaults, overrides)
}
