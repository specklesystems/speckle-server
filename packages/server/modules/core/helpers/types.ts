import { Nullable } from '@/modules/shared/helpers/typeHelper'

export type UserRecord = {
  id: string
  suuid: string
  createdAt: Date
  name: string
  bio: Nullable<string>
  company: Nullable<string>
  email: string
  verified: boolean
  avatar: string
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
}

export type ServerInfo = ServerConfigRecord & {
  /**
   * Dynamically resolved from env vars
   */
  version: string
}
