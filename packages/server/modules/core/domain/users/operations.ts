import { User, UserWithOptionalRole } from '@/modules/core/domain/users/types'
import { ServerAclRecord } from '@/modules/core/helpers/types'
import { Nullable, NullableKeysToOptional, ServerRoles } from '@speckle/shared'

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

export type StoreUser = (params: {
  user: Omit<NullableKeysToOptional<User>, 'suuid' | 'createdAt'>
}) => Promise<User>

export type CountAdminUsers = () => Promise<number>

export type StoreUserAcl = (params: {
  acl: ServerAclRecord
}) => Promise<ServerAclRecord>

export type LegacyGetUser = (id: string) => Promise<User>

export type LegacyGetPaginatedUsers = (
  limit?: number,
  offset?: number,
  searchQuery?: string | null
) => Promise<User[]>

export type LegacyGetPaginatedUsersCount = (
  searchQuery?: string | null
) => Promise<number>

export type CreateValidatedUser = (
  user: NullableKeysToOptional<Pick<User, 'bio' | 'name' | 'company' | 'avatar'>> & {
    email: string
    verified?: boolean
    password?: string
    role?: ServerRoles
  },
  options?: Partial<{
    skipPropertyValidation: boolean
  }>
) => Promise<string>
