import {
  StreamWithCommitId,
  StreamWithOptionalRole,
  LimitedUserWithStreamRole,
  Stream
} from '@/modules/core/domain/streams/types'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import {
  ProjectCreateInput,
  StreamCreateInput
} from '@/modules/core/graph/generated/graphql'
import { ContextResourceAccessRules } from '@/modules/core/helpers/token'
import { MaybeNullOrUndefined, Optional, StreamRoles } from '@speckle/shared'
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

export type GetStreamCollaborators = (
  streamId: string,
  type?: StreamRoles
) => Promise<Array<LimitedUserWithStreamRole>>

export type StoreStream = (
  input: StreamCreateInput | ProjectCreateInput,
  options?: Partial<{
    ownerId: string
    trx: Knex.Transaction
  }>
) => Promise<Stream>

export type DeleteStreamRecords = (streamId: string) => Promise<number>

export type CreateStream = (
  params: (StreamCreateInput | ProjectCreateInput) & {
    ownerId: string
    ownerResourceAccessRules?: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  },
  options?: Partial<{
    createActivity: boolean
  }>
) => Promise<Stream>

export type LegacyCreateStream = (
  params: StreamCreateInput & { ownerId: string }
) => Promise<string>

export type DeleteStream = (
  streamId: string,
  deleterId: string,
  deleterResourceAccessRules: ContextResourceAccessRules,
  options?: {
    skipAccessChecks?: boolean
  }
) => Promise<boolean>
