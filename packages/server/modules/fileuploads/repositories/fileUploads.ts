import { Branches, FileUploads, knex } from '@/modules/core/dbSchema'
import {
  UpdateFileStatus,
  GarbageCollectPendingUploadedFiles,
  GetFileInfo,
  SaveUploadFile,
  SaveUploadFileV2,
  SaveUploadFileInput,
  SaveUploadFileInputV2
} from '@/modules/fileuploads/domain/operations'
import {
  FileUploadConvertedStatus,
  FileUploadRecord,
  FileUploadRecordV2
} from '@/modules/fileuploads/helpers/types'
import { Knex } from 'knex'
import { FileImportJobNotFoundError } from '@/modules/fileuploads/helpers/errors'

const tables = {
  fileUploads: (db: Knex) => db<FileUploadRecord>(FileUploads.name)
}

export const getFileInfoFactory =
  (deps: { db: Knex }): GetFileInfo =>
  async (params: { fileId: string }) => {
    const { fileId } = params
    const fileInfo = await tables
      .fileUploads(deps.db)
      .where({ [FileUploads.col.id]: fileId })
      .select<FileUploadRecord[]>('*')
      .first()
    return fileInfo
  }

export const getStreamFileUploadsFactory =
  (deps: { db: Knex }) => async (params: { streamId: string }) => {
    const { streamId } = params
    const fileInfos = await tables
      .fileUploads(deps.db)
      .select<FileUploadRecord[]>('*')
      .where({ [FileUploads.col.streamId]: streamId })
      .andWhere((q1) => {
        q1.orWhereIn(FileUploads.col.convertedStatus, [
          FileUploadConvertedStatus.Completed,
          FileUploadConvertedStatus.Error
        ]).orWhere(
          FileUploads.col.uploadDate,
          '>=',
          knex.raw(`now()-'1 day'::interval`)
        )
      })
      .orderBy([
        { column: FileUploads.withoutTablePrefix.col.uploadDate, order: 'desc' }
      ])
    return fileInfos
  }

// While we haven't fully migrated to new endpoint
const mapFileUploadRecordToV2 = (record: FileUploadRecord): FileUploadRecordV2 => {
  return {
    id: record.id,
    projectId: record.streamId,
    modelId: record.modelId,
    userId: record.userId,
    fileName: record.fileName,
    fileType: record.fileType,
    fileSize: record.fileSize,
    uploadComplete: record.uploadComplete,
    uploadDate: record.uploadDate,
    convertedStatus: record.convertedStatus,
    convertedLastUpdate: record.convertedLastUpdate,
    convertedMessage: record.convertedMessage,
    convertedCommitId: record.convertedCommitId
  } as FileUploadRecordV2
}

export const saveUploadFileFactory =
  (deps: { db: Knex }): SaveUploadFile =>
  async ({
    fileId,
    streamId,
    branchName,
    userId,
    fileName,
    fileType,
    fileSize
  }: SaveUploadFileInput) => {
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
    const [newRecord] = await tables.fileUploads(deps.db).insert(dbFile, '*')
    return newRecord as FileUploadRecord
  }

export const saveUploadFileFactoryV2 =
  (deps: { db: Knex }): SaveUploadFileV2 =>
  async ({
    fileId,
    projectId,
    modelId,
    userId,
    fileName,
    fileType,
    fileSize,
    modelName
  }: SaveUploadFileInputV2) => {
    const dbFile: Partial<SaveUploadFileV2> = {
      id: fileId,
      streamId: projectId,
      branchName: modelName, // @deprecated
      userId,
      modelId,
      fileName,
      fileType,
      fileSize,
      uploadComplete: true
    }
    const [newRecord] = await tables.fileUploads(deps.db).insert(dbFile, '*')
    return mapFileUploadRecordToV2(newRecord)
  }

export const expireOldPendingUploadsFactory =
  (deps: { db: Knex }): GarbageCollectPendingUploadedFiles =>
  async (params: { timeoutThresholdSeconds: number }) => {
    const updatedRows = await deps
      .db(FileUploads.name)
      .whereIn(FileUploads.withoutTablePrefix.col.convertedStatus, [
        FileUploadConvertedStatus.Converting,
        FileUploadConvertedStatus.Queued
      ])
      .andWhere(
        FileUploads.withoutTablePrefix.col.uploadDate,
        '<',
        deps.db.raw(`now() - interval '${params.timeoutThresholdSeconds} seconds'`)
      )
      .update({
        [FileUploads.withoutTablePrefix.col.convertedStatus]:
          FileUploadConvertedStatus.Error
      })
      .returning<FileUploadRecord[]>('*')

    return updatedRows
  }

const getPendingUploadsBaseQueryFactory =
  (deps: { db: Knex }) =>
  (streamId: string, options?: Partial<{ ignoreOld: boolean; limit: number }>) => {
    const { ignoreOld = true, limit } = options || {}

    const q = tables
      .fileUploads(deps.db)
      .where(FileUploads.col.streamId, streamId)
      .whereIn(FileUploads.col.convertedStatus, [
        FileUploadConvertedStatus.Queued,
        FileUploadConvertedStatus.Converting
      ])
      .orderBy(FileUploads.col.uploadDate, 'desc')

    if (ignoreOld) {
      q.andWhere(FileUploads.col.uploadDate, '>=', knex.raw(`now()-'1 day'::interval`))
    }

    if (limit) {
      q.limit(limit)
    }

    return q
  }

export const getStreamPendingModelsFactory =
  (deps: { db: Knex }) =>
  async (
    streamId: string,
    options?: Partial<{ limit: number; branchNamePattern: string }>
  ) => {
    const q = getPendingUploadsBaseQueryFactory(deps)(streamId, {
      limit: options?.limit
    }).whereNotIn(
      FileUploads.col.branchName,
      Branches.knex().select(Branches.col.name).where(Branches.col.streamId, streamId)
    )

    if (options?.branchNamePattern) {
      q.whereRaw(
        knex.raw(`?? ~* ?`, [FileUploads.col.branchName, options.branchNamePattern])
      )
    }

    return await q
  }

export const getBranchPendingVersionsFactory =
  (deps: { db: Knex }) =>
  async (
    streamId: string,
    branchName: string,
    options?: Partial<{ limit: number }>
  ) => {
    const q = getPendingUploadsBaseQueryFactory(deps)(streamId, {
      limit: options?.limit
    })
      .where(FileUploads.col.branchName, branchName)
      .whereIn(
        FileUploads.col.branchName,
        Branches.knex().select(Branches.col.name).where(Branches.col.streamId, streamId)
      )

    return await q
  }

export const updateFileStatusFactory =
  (deps: { db: Knex }): UpdateFileStatus =>
  async (params) => {
    const { fileId, status, convertedMessage, convertedCommitId } = params
    const fileInfos = await tables
      .fileUploads(deps.db)
      .update<FileUploadRecord[]>({
        [FileUploads.withoutTablePrefix.col.convertedStatus]: status,
        [FileUploads.withoutTablePrefix.col.convertedLastUpdate]: knex.fn.now(),
        [FileUploads.withoutTablePrefix.col.convertedMessage]: convertedMessage,
        [FileUploads.withoutTablePrefix.col.convertedCommitId]: convertedCommitId
      })
      .where({ [FileUploads.withoutTablePrefix.col.id]: fileId })
      .returning<FileUploadRecord[]>('*')

    if (fileInfos.length === 0) {
      throw new FileImportJobNotFoundError(`File with id ${fileId} not found`)
    }
    return fileInfos[0]
  }
