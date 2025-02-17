import { TokenScopeData, UserRole } from '@/modules/shared/domain/rolesAndScopes/types'

export type GetRoles = () => Promise<UserRole[]>
export type UpsertRole = (args: { role: UserRole }) => Promise<void>

export type GetScopes = () => Promise<TokenScopeData[]>
