import { AuthPipelineFunction } from '@/modules/shared/domain/authz/types'
import { ServerRoles, StreamRoles } from '@speckle/shared'

export type ValidateServerRoleBuilder = (params: {
  requiredRole: ServerRoles
}) => AuthPipelineFunction

export type ValidateStreamRoleBuilder = (params: {
  requiredRole: StreamRoles
}) => AuthPipelineFunction
