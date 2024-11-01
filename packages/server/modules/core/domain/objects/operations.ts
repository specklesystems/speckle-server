import { Logger } from '@/logging/logging'
import {
  InsertableSpeckleObject,
  RawSpeckleObject,
  SpeckleObject,
  SpeckleObjectClosureEntry
} from '@/modules/core/domain/objects/types'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'
import { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import { Knex } from 'knex'
import type stream from 'node:stream'

export type GetStreamObjects = (
  streamId: string,
  objectIds: string[]
) => Promise<SpeckleObject[]>

export type GetObject = (
  objectId: string,
  streamId: string
) => Promise<Optional<SpeckleObject>>

export type GetFormattedObject = (params: {
  streamId: string
  objectId: string
}) => Promise<Nullable<Omit<SpeckleObject, 'streamId'>>>

export type GetBatchedStreamObjects = (
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) => AsyncGenerator<SpeckleObject[], void, unknown>

export type StoreObjects = (
  objects: SpeckleObject[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<number[]>

export type StoreSingleObjectIfNotFound = (
  object: SpeckleObject | InsertableSpeckleObject
) => Promise<void>

export type StoreObjectsIfNotFound = (
  objects: Array<SpeckleObject | InsertableSpeckleObject>
) => Promise<void>

export type StoreClosuresIfNotFound = (
  closures: SpeckleObjectClosureEntry[]
) => Promise<void>

export type GetObjectChildrenStream = (params: {
  streamId: string
  objectId: string
}) => Promise<stream.PassThrough & AsyncIterable<{ dataText: string; id: string }>>

export type GetObjectsStream = (params: {
  streamId: string
  objectIds: string[]
}) => Promise<
  stream.PassThrough &
    AsyncIterable<
      {
        dataText: string
      } & Pick<
        SpeckleObject,
        | 'id'
        | 'speckleType'
        | 'totalChildrenCount'
        | 'totalChildrenCountByDepth'
        | 'createdAt'
      >
    >
>

export type GetObjectChildren = (params: {
  streamId: string
  objectId: string
  limit?: MaybeNullOrUndefined<number | string>
  depth?: MaybeNullOrUndefined<number | string>
  select?: MaybeNullOrUndefined<string[]>
  cursor?: MaybeNullOrUndefined<string>
}) => Promise<{
  objects: Omit<SpeckleObject, 'totalChildrenCountByDepth' | 'streamId'>[]
  cursor: string | null
}>

export type HasObjects = (params: {
  streamId: string
  objectIds: string[]
}) => Promise<{ [objectId: string]: boolean }>

export type GetObjectChildrenQuery = (params: {
  streamId: string
  objectId: string
  limit?: MaybeNullOrUndefined<number | string>
  depth?: MaybeNullOrUndefined<number | string>
  select?: MaybeNullOrUndefined<string[]>
  cursor?: MaybeNullOrUndefined<string>
  query?: Array<{ field: string; verb?: string; value: unknown; operator: string }>
  orderBy?: { field: keyof SpeckleObject; direction: 'asc' | 'desc' }
}) => Promise<{
  objects: Omit<SpeckleObject, 'totalChildrenCountByDepth' | 'streamId'>[]
  cursor: string | null
  totalCount: number
}>

export type CreateObject = (params: {
  streamId: string
  object: RawSpeckleObject
  logger?: Logger
}) => Promise<string>

type CreateObjectsParams = {
  streamId: string
  objects: RawSpeckleObject[]
  logger?: Logger
}

export type CreateObjectsBatched = (params: CreateObjectsParams) => Promise<boolean>

export type CreateObjectsBatchedAndNoClosures = (
  params: CreateObjectsParams
) => Promise<string[]>

export type CreateObjects = (params: CreateObjectsParams) => Promise<string[]>
