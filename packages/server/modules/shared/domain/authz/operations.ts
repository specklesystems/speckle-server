import type { AuthPipelineFunction } from '@/modules/shared/domain/authz/types'
import type { ServerRoles, StreamRoles } from '@speckle/shared'

export type ValidateServerRoleBuilder = (params: {
  requiredRole: ServerRoles
}) => AuthPipelineFunction

export type ValidateStreamRoleBuilder = (params: {
  requiredRole: StreamRoles
}) => AuthPipelineFunction
