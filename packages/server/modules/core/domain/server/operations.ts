import { Scope, ServerInfo, UserRole } from '@/modules/core/domain/server/types'
import { ServerConfigRecord } from '@/modules/core/helpers/types'

export type GetServerInfo = () => Promise<ServerInfo>

export type UpdateServerInfo = (
  update: Omit<Partial<ServerConfigRecord>, 'id' | 'canonicalUrl' | 'completed'>
) => Promise<void>

export type GetPublicRoles = () => Promise<UserRole[]>

export type GetPublicScopes = () => Promise<Scope[]>
