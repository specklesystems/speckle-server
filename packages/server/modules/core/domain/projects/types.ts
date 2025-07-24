import type { LimitedUserRecord, UserWithRole } from '@/modules/core/helpers/types'
import type { StreamRoles } from '@speckle/shared'

export type ProjectTeamMember = UserWithRole<LimitedUserRecord> & {
  streamRole: StreamRoles
}
