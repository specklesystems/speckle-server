import {
  LimitedUser,
  User,
  UserWithOptionalRole
} from '@/modules/core/domain/users/types'
import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import { ServerAclRecord, UserWithRole } from '@/modules/core/helpers/types'
import {
  Nullable,
  NullableKeysToOptional,
  Optional,
  ServerRoles
} from '@speckle/shared'

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

export type GetUserByEmail = (
  email: string,
  options?: Partial<{
    skipClean: boolean
    withRole: boolean
  }>
) => Promise<UserWithOptionalRole | null>

export type StoreUser = (params: {
  user: Omit<NullableKeysToOptional<User>, 'suuid' | 'createdAt'>
}) => Promise<User>

export type UpdateUser = (
  userId: string,
  update: Partial<User>,
  options?: Partial<{
    skipClean: boolean
  }>
) => Promise<Nullable<User>>

export type DeleteUserRecord = (userId: string) => Promise<boolean>

export type CountAdminUsers = () => Promise<number>

export type IsLastAdminUser = (userId: string) => Promise<boolean>

type UserQuery = {
  query: string | null
  role?: ServerRoles | null
}

export type ListPaginatedUsersPage = (
  params: {
    limit: number
    cursor?: Date | null
  } & UserQuery
) => Promise<UserWithRole[]>

export type CountUsers = (params: UserQuery) => Promise<number>

export type StoreUserAcl = (params: {
  acl: ServerAclRecord
}) => Promise<ServerAclRecord>

export type UpdateUserServerRole = (params: {
  userId: string
  role: ServerRoles
}) => Promise<boolean>

export type MarkUserAsVerified = (email: string) => Promise<boolean>

export type MarkOnboardingComplete = (userId: string) => Promise<boolean>

export type GetFirstAdmin = () => Promise<Optional<User>>

export type LegacyGetUserByEmail = (params: {
  email: string
}) => Promise<Nullable<Omit<User, 'passwordDigest'>>>

export type LegacyGetUser = (id: string) => Promise<User>

export type LegacyGetPaginatedUsers = (
  limit?: number,
  offset?: number,
  searchQuery?: string | null
) => Promise<User[]>

export type LegacyGetPaginatedUsersCount = (
  searchQuery?: string | null
) => Promise<number>

export type GetUserRole = (id: string) => Promise<Nullable<ServerRoles>>

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

export type FindOrCreateValidatedUser = (params: {
  user: {
    email: string
    name: string
    role?: ServerRoles
    bio?: string
    verified?: boolean
  }
}) => Promise<{
  id: string
  email: string
  isNewUser?: boolean
}>

export type UpdateUserAndNotify = (
  userId: string,
  update: UserUpdateInput
) => Promise<User>

export type ChangeUserPassword = (params: {
  id: string
  newPassword: string
}) => Promise<void>

export type ValidateUserPassword = (params: {
  email: string
  password: string
}) => Promise<boolean>

export type DeleteUser = (id: string) => Promise<boolean>

export type ChangeUserRole = (params: { userId: string; role: string }) => Promise<void>

export type SearchLimitedUsers = (
  searchQuery: string,
  limit?: number,
  cursor?: string,
  archived?: boolean,
  emailOnly?: boolean
) => Promise<{
  users: LimitedUser[]
  cursor: Nullable<string>
}>

type AdminUserListArgs = {
  cursor: string | null
  query: string | null
  limit: number
  role: ServerRoles | null
}

export type AdminUserList = (args: AdminUserListArgs) => Promise<{
  totalCount: number
  items: UserWithRole[]
  cursor: string | null
}>
