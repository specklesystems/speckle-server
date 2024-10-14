import { User, UserWithOptionalRole } from '@/modules/core/domain/users/types'
import { Nullable } from '@speckle/shared'

export type GetUserParams = Partial<{
  /**
   * Join server_acl and get user role info
   */
  withRole: boolean

  /**
   * Skip record sanitization. ONLY use when you wish to work with a user's password digest
   */
  skipClean: boolean
}>

export type GetUsers = (
  userIds: string | string[],
  params?: GetUserParams
) => Promise<UserWithOptionalRole[]>

export type GetUser = (
  userId: string,
  params?: GetUserParams
) => Promise<Nullable<UserWithOptionalRole>>

export type LegacyGetUser = (id: string) => Promise<User>
