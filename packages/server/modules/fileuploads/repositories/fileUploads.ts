import { Branches, FileUploads, knex } from '@/modules/core/dbSchema'
import {
  FileUploadConvertedStatus,
  FileUploadRecord
} from '@/modules/fileuploads/helpers/types'

export async function getFileInfo(params: { fileId: string }) {
  const { fileId } = params
  const fileInfo = await FileUploads.knex()
    .where({ [FileUploads.col.id]: fileId })
    .select<FileUploadRecord[]>('*')
    .first()
  return fileInfo
}

export async function getStreamFileUploads(params: { streamId: string }) {
  const { streamId } = params
  const fileInfos = await FileUploads.knex()
    .where({ [FileUploads.col.streamId]: streamId })
    .select<FileUploadRecord[]>('*')
    .orderBy([{ column: FileUploads.withoutTablePrefix.col.uploadDate, order: 'desc' }])
  return fileInfos
}

export type SaveUploadFileInput = Pick<
  FileUploadRecord,
  'streamId' | 'branchName' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string }

export async function saveUploadFile({
  fileId,
  streamId,
  branchName,
  userId,
  fileName,
  fileType,
  fileSize
}: SaveUploadFileInput) {
  const dbFile: Partial<FileUploadRecord> = {
    id: fileId,
    streamId,
    branchName,
    userId,
    fileName,
    fileType,
    fileSize,
    uploadComplete: true
  }
  const [newRecord] = await FileUploads.knex().insert(dbFile, '*')
  return newRecord as FileUploadRecord
}

export async function getStreamPendingModels(
  streamId: string,
  options?: Partial<{ limit: number; branchNamePattern: string }>
) {
  const q = FileUploads.knex<FileUploadRecord[]>()
    .where(FileUploads.col.streamId, streamId)
    .whereIn(FileUploads.col.convertedStatus, [
      FileUploadConvertedStatus.Queued,
      FileUploadConvertedStatus.Converting
    ])
    .whereNotIn(
      FileUploads.col.branchName,
      Branches.knex().select(Branches.col.name).where(Branches.col.streamId, streamId)
    )
    .orderBy(FileUploads.col.uploadDate, 'desc')

  if (options?.limit) {
    q.limit(options.limit)
  }

  if (options?.branchNamePattern) {
    q.whereRaw(
      knex.raw(`?? ~* ?`, [FileUploads.col.branchName, options.branchNamePattern])
    )
  }

  return await q
}

export async function getBranchPendingVersions(
  streamId: string,
  branchName: string,
  options?: Partial<{ limit: number }>
) {
  const q = FileUploads.knex<FileUploadRecord[]>()
    .where(FileUploads.col.streamId, streamId)
    .where(FileUploads.col.branchName, branchName)
    .whereIn(FileUploads.col.convertedStatus, [
      FileUploadConvertedStatus.Queued,
      FileUploadConvertedStatus.Converting
    ])
    .whereIn(
      FileUploads.col.branchName,
      Branches.knex().select(Branches.col.name).where(Branches.col.streamId, streamId)
    )
    .orderBy(FileUploads.col.uploadDate, 'desc')

  if (options?.limit) {
    q.limit(options.limit)
  }

  return await q
}
