import type {
  LimitedUser,
  User,
  UserOnboardingChoices,
  UserSignUpContext,
  UserWithOptionalRole
} from '@/modules/core/domain/users/types'
import type { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import type { ServerInviteGraphQLReturnType } from '@/modules/core/helpers/graphTypes'
import type { ServerAclRecord, UserWithRole } from '@/modules/core/helpers/types'
import type {
  MaybeNullOrUndefined,
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
    /**
     * Only OK to leave unset in fake/simulated scenarios such as tests
     */
    signUpContext?: Optional<UserSignUpContext>
  },
  options?: Partial<{
    skipPropertyValidation: boolean
    allowPersonalEmail: boolean
  }>
) => Promise<string>

export type FindOrCreateValidatedUser = (params: {
  user: {
    email: string
    name: string
    role?: ServerRoles
    bio?: string
    verified?: boolean
    /**
     * Only OK to leave unset in fake/simulated scenarios such as tests
     */
    signUpContext?: Optional<UserSignUpContext>
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

export type DeleteUser = (id: string, invokerId?: string) => Promise<boolean>

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

export type LookupUsers = (filter: {
  query: string
  /**
   * Only find user with directly matching email
   */
  emailOnly?: MaybeNullOrUndefined<boolean>
  /**
   * Only find users that are collaborators of the specified project
   */
  projectId?: MaybeNullOrUndefined<string>
  /**
   * Defaults to 10
   */
  limit?: MaybeNullOrUndefined<number>
  cursor?: MaybeNullOrUndefined<string>
  archived?: MaybeNullOrUndefined<boolean>
}) => Promise<{
  users: User[]
  cursor: Nullable<string>
}>

/**
 * @returns An array of matches in order provided, or null for positions where no match found for email.
 */
export type BulkLookupUsers = (filter: {
  emails: string[]
  /**
   * Defaults to 10
   */
  limit?: MaybeNullOrUndefined<number>
  cursor?: MaybeNullOrUndefined<string>
}) => Promise<(User | null)[]>

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

export type LegacyAdminUsersPaginationParams = {
  limit: number
  offset: number
  query: string | null
}

export type LegacyAdminUsersListItem = {
  registeredUser: Nullable<User>
  invitedUser: Nullable<{
    id: string
    email: string
    invitedById: string
  }>
  id: string
}

type LegacyAdminUsersListCollection = {
  totalCount: number
  items: Array<LegacyAdminUsersListItem>
}

export type LegacyGetAdminUsersListCollection = (
  params: LegacyAdminUsersPaginationParams
) => Promise<LegacyAdminUsersListCollection>

type CollectionQueryArgs = {
  cursor: string | null
  query: string | null
  limit: number
}

export type AdminGetInviteList = (args: CollectionQueryArgs) => Promise<{
  cursor: string | null
  totalCount: number
  items: ServerInviteGraphQLReturnType[]
}>

export type UpdateUserMixpanelProfile = (params: { userId: string }) => Promise<void>

export type SetUserOnboardingChoices = (params: {
  userId: string
  choices: UserOnboardingChoices
}) => Promise<void>
