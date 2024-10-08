import {
  StreamWithCommitId,
  StreamWithOptionalRole
} from '@/modules/core/domain/streams/types'
import { Optional } from '@speckle/shared'
import { Knex } from 'knex'

export type GetStreams = (
  streamIds: string[],
  options?: Partial<{
    userId: string
    trx: Knex.Transaction
  }>
) => Promise<StreamWithOptionalRole[]>

export type GetStream = (
  params: {
    streamId?: string
    userId?: string
  },
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<Optional<StreamWithOptionalRole>>

export type GetCommitStreams = (params: {
  commitIds: string[]
  userId?: string
}) => Promise<StreamWithCommitId[]>

export type GetCommitStream = (params: {
  commitId: string
  userId?: string
}) => Promise<Optional<StreamWithCommitId>>
