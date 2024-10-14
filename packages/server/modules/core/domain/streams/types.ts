import {
  LimitedUserRecord,
  StreamFavoriteRecord,
  StreamRecord,
  UserWithRole
} from '@/modules/core/helpers/types'
import { StreamRoles } from '@speckle/shared'

export type Stream = StreamRecord
export type Project = Stream
export type StreamFavoriteMetadata = StreamFavoriteRecord

export type StreamWithOptionalRole = Stream & {
  /**
   * Available, if query joined this data StreamAcl
   */
  role?: StreamRoles
}

export type StreamWithCommitId<StreamType extends Stream = StreamWithOptionalRole> =
  StreamType & {
    commitId: string
  }

export type LimitedUserWithStreamRole = UserWithRole<LimitedUserRecord> & {
  streamRole: StreamRoles
}
