import { Branches, FileUploads } from '@/modules/core/dbSchema'
import type {
  GarbageCollectPendingUploadedFiles,
  GetFileInfo,
  SaveUploadFile,
  SaveUploadFileV2,
  SaveUploadFileInput,
  SaveUploadFileInputV2,
  GetFileInfoV2,
  UpdateFileUpload,
  GetModelUploadsItems,
  GetModelUploadsBaseArgs,
  GetModelUploadsTotalCount,
  UpdateFileStatus,
  FailPendingUploadedFiles
} from '@/modules/fileuploads/domain/operations'
import type {
  FileUploadRecord,
  FileUploadRecordV2
} from '@/modules/fileuploads/helpers/types'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import type { Knex } from 'knex'
import { FileImportJobNotFoundError } from '@/modules/fileuploads/helpers/errors'
import { compositeCursorTools } from '@/modules/shared/helpers/dbHelper'
import { clamp } from 'lodash-es'

const tables = {
  fileUploads: (db: Knex) => db<FileUploadRecord>(FileUploads.name)
}

const getCursorTools = () =>
  compositeCursorTools({
    schema: FileUploads,
    cols: ['convertedLastUpdate', 'id']
  })

export const getFileInfoFactory =
  (deps: { db: Knex }): GetFileInfo =>
  async (params) => {
    const { fileId } = params
    const fileInfo = await tables
      .fileUploads(deps.db)
      .where({ [FileUploads.col.id]: fileId })
      .select<FileUploadRecord[]>('*')
      .first()
    return fileInfo
  }

export const getFileInfoFactoryV2 =
  (deps: { db: Knex }): GetFileInfoV2 =>
  async (params) => {
    const { fileId, projectId } = params
    const q = tables
      .fileUploads(deps.db)
      .where({ [FileUploads.col.id]: fileId })
      .select<FileUploadRecord[]>('*')

    if (projectId) q.andWhere(FileUploads.col.streamId, projectId)
    const fileInfo = await q.first()
    if (!fileInfo) return undefined

    return { ...fileInfo, projectId: fileInfo.streamId } satisfies FileUploadRecordV2
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
          deps.db.raw(`now()-'1 day'::interval`)
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
    fileSize,
    modelId
  }: SaveUploadFileInput) => {
    const dbFile: Partial<FileUploadRecord> = {
      id: fileId,
      streamId,
      branchName,
      userId,
      fileName,
      fileType: fileType.toLowerCase(),
      fileSize,
      uploadComplete: true,
      modelId
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
      fileType: fileType.toLowerCase(),
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
        FileUploadConvertedStatus.Converting
      ])
      .andWhere(
        FileUploads.withoutTablePrefix.col.convertedLastUpdate,
        '<',
        deps.db.raw(`now() - interval '${params.timeoutThresholdSeconds} seconds'`)
      )
      .update({
        [FileUploads.withoutTablePrefix.col.convertedStatus]:
          FileUploadConvertedStatus.Error,
        [FileUploads.withoutTablePrefix.col.convertedMessage]:
          'File import job timed out',
        [FileUploads.withoutTablePrefix.col.convertedLastUpdate]: deps.db.fn.now()
      })
      .returning<FileUploadRecord[]>('*')

    return updatedRows
  }

export const failPendingUploadedFilesFactory =
  (deps: { db: Knex }): FailPendingUploadedFiles =>
  async (params) => {
    const updatedRows = await deps
      .db(FileUploads.name)
      .whereIn(FileUploads.withoutTablePrefix.col.id, params.uploadIds)
      .andWhere(
        FileUploads.withoutTablePrefix.col.convertedStatus,
        FileUploadConvertedStatus.Queued
      ) // and/or Converting?
      .update({
        [FileUploads.withoutTablePrefix.col.convertedStatus]:
          FileUploadConvertedStatus.Error,
        [FileUploads.withoutTablePrefix.col.convertedMessage]: 'File import job failed',
        [FileUploads.withoutTablePrefix.col.convertedLastUpdate]: deps.db.fn.now()
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
      q.andWhere(
        FileUploads.col.uploadDate,
        '>=',
        deps.db.raw(`now()-'1 day'::interval`)
      )
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
        deps.db.raw(`?? ~* ?`, [FileUploads.col.branchName, options.branchNamePattern])
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

export const updateFileUploadFactory =
  (deps: { db: Knex }): UpdateFileUpload =>
  async (params) => {
    const { id, upload } = params
    const updatedFile = await tables
      .fileUploads(deps.db)
      .update(upload)
      .where({ [FileUploads.col.id]: id })
      .returning<FileUploadRecord[]>('*')

    if (updatedFile.length === 0) {
      throw new FileImportJobNotFoundError(`File with id ${id} not found`)
    }
    return updatedFile[0]
  }

export const updateFileStatusFactory =
  (deps: { db: Knex }): UpdateFileStatus =>
  async (params) => {
    const updatedFile = await tables
      .fileUploads(deps.db)
      .update({
        [FileUploads.withoutTablePrefix.col.convertedStatus]: params.status,
        [FileUploads.withoutTablePrefix.col.convertedMessage]: params.convertedMessage,
        [FileUploads.withoutTablePrefix.col.convertedCommitId]:
          params.convertedCommitId,
        [FileUploads.withoutTablePrefix.col.convertedLastUpdate]: deps.db.fn.now()
      })
      .where({
        [FileUploads.withoutTablePrefix.col.id]: params.fileId,
        [FileUploads.withoutTablePrefix.col.streamId]: params.projectId
      })
      .returning<FileUploadRecord[]>('*')

    if (updatedFile.length === 0) {
      throw new FileImportJobNotFoundError(`File with id ${params.fileId} not found`)
    }
    return updatedFile[0]
  }

const getModelUploadsBaseQueryFactory =
  (deps: { db: Knex }) => (params: GetModelUploadsBaseArgs) => {
    const { projectId, modelId } = params
    const q = tables
      .fileUploads(deps.db)
      .where(FileUploads.col.streamId, projectId)
      .andWhere(FileUploads.col.modelId, modelId)

    return q
  }

export const getModelUploadsItemsFactory =
  (deps: { db: Knex }): GetModelUploadsItems =>
  async (params) => {
    const limit = clamp(params.limit || 0, 0, 100)
    const { applyCursorSortAndFilter, resolveNewCursor } = getCursorTools()

    const q = getModelUploadsBaseQueryFactory(deps)(params).limit(limit)

    applyCursorSortAndFilter({
      query: q,
      cursor: params.cursor
    })

    const rows = await q
    const newCursor = resolveNewCursor(rows)

    return {
      items: rows,
      cursor: newCursor
    }
  }

export const getModelUploadsTotalCountFactory =
  (deps: { db: Knex }): GetModelUploadsTotalCount =>
  async (params) => {
    const q = getModelUploadsBaseQueryFactory(deps)(params)
    const [{ count }] = await q.count()
    return parseInt(count + '')
  }
