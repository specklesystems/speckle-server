import { LimitedUserRecord, UserWithRole } from '@/modules/core/helpers/types'
import { StreamRoles } from '@speckle/shared'

export type ProjectTeamMember = UserWithRole<LimitedUserRecord> & {
  streamRole: StreamRoles
}
