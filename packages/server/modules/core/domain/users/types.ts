import { LimitedUserRecord, UserRecord } from '@/modules/core/helpers/userHelper'
import { ServerRoles } from '@speckle/shared'

export type User = UserRecord
export type LimitedUser = LimitedUserRecord

export type UserWithOptionalRole<UserType extends LimitedUserRecord = UserRecord> =
  UserType & {
    /**
     * Available, if query joined this data from server_acl
     * (this can be the server role or stream role depending on how and where this was retrieved)
     */
    role?: ServerRoles
  }
