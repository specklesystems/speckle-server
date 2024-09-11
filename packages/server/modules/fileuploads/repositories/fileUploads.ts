import { Branches, FileUploads, knex } from '@/modules/core/dbSchema'
import { GetFileInfo, SaveUploadFile } from '@/modules/fileuploads/domain/operations'
import {
  FileUploadConvertedStatus,
  FileUploadRecord
} from '@/modules/fileuploads/helpers/types'
import { Knex } from 'knex'

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

export type SaveUploadFileInput = Pick<
  FileUploadRecord,
  'streamId' | 'branchName' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
> & { fileId: string }

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
