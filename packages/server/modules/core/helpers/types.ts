/* eslint-disable @typescript-eslint/no-explicit-any */
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { BaseMetaRecord } from '@/modules/core/helpers/meta'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerRoles } from '@speckle/shared'

export type UserRecord = {
  id: string
  suuid: string
  createdAt: Date
  name: string
  bio: Nullable<string>
  company: Nullable<string>
  email: string
  verified: boolean
  avatar: Nullable<string>
  profiles: Nullable<string>
  /**
   * Marked as optional, cause most queries delete it
   */
  passwordDigest?: Nullable<string>
  ip: Nullable<string>
}

/**
 * Reduced record with fields that are OK to show publicly
 */
export type LimitedUserRecord = Pick<
  UserRecord,
  'id' | 'name' | 'bio' | 'company' | 'verified' | 'avatar' | 'createdAt'
>

export type UserWithRole<User extends LimitedUserRecord = UserRecord> = User & {
  role: ServerRoles
}

export type UsersMetaRecord<V = any> = {
  userId: string
} & BaseMetaRecord<V>

export type ServerAclRecord = {
  userId: string
  role: string
}

export type StreamRecord = {
  id: string
  name: string
  description: Nullable<string>
  isPublic: boolean
  clonedFrom: Nullable<string>
  createdAt: Date
  updatedAt: Date
  allowPublicComments: boolean
  isDiscoverable: boolean
  workspaceId: Nullable<string>
  regionKey: Nullable<string>
}

export type StreamAclRecord = {
  userId: string
  resourceId: string
  role: string
}

export type StreamFavoriteRecord = {
  streamId: string
  userId: string
  createdAt: Date
  cursor: string
}

export type ServerConfigRecord = {
  id: number
  name: string
  company: string
  description: string
  adminContact: string
  termsOfService: string
  canonicalUrl: string
  completed: boolean
  inviteOnly: boolean
  guestModeEnabled: boolean
}

export type ServerInfo = ServerConfigRecord & {
  /**
   * Dynamically resolved from env vars
   */
  version: string
  migration?: { movedFrom?: string; movedTo?: string }
  configuration: {
    objectSizeLimitBytes: number
    objectMultipartUploadSizeLimitBytes: number
  }
}

export type CommitRecord = {
  id: string
  referencedObject: string
  author: Nullable<string>
  message: Nullable<string>
  createdAt: Date
  sourceApplication: Nullable<string>
  totalChildrenCount: Nullable<number>
  parents: Nullable<string[]>
}

export type BranchCommitRecord = {
  branchId: string
  commitId: string
}

export type StreamCommitRecord = {
  streamId: string
  commitId: string
}

export type BranchRecord = {
  id: string
  streamId: string
  authorId: string
  name: string
  description: Nullable<string>
  createdAt: Date
  updatedAt: Date
}

export type ObjectRecord = {
  id: string
  speckleType: string
  totalChildrenCount: Nullable<number>
  totalChildrenCountByDepth: Nullable<Record<string, unknown>>
  createdAt: Date
  data: Nullable<Record<string, unknown>>
  streamId: string
}

export type ObjectChildrenClosureRecord = {
  parent: string
  child: string
  minDepth: number
  streamId: string
}

export type InvalidTokenResult = {
  valid: false
}

export type ValidTokenResult = {
  valid: true
  scopes: string[]
  userId: string
  role: ServerRoles
  /**
   * Set, if the token is an app token
   */
  appId: Nullable<string>
  /**
   * Set, if the token has resource access limits (e.g. only access to specific projects)
   */
  resourceAccessRules: Nullable<TokenResourceAccessRecord[]>
}

export type TokenValidationResult = InvalidTokenResult | ValidTokenResult

export type TokenScopesRecord = {
  tokenId: string
  scopeName: string
}

export type ServerAppRecord = {
  id: string
  secret: Nullable<string>
  name: string
  description: Nullable<string>
  termsAndConditionsLink: Nullable<string>
  logo: Nullable<string>
  public: boolean
  trustByDefault: boolean
  authorId: string
  createdAt: Date
  redirectUrl: string
}

export type TokenResourceAccessRecord = {
  tokenId: string
  resourceId: string
  resourceType: TokenResourceIdentifierType
}
