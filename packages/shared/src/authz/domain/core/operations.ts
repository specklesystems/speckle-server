import Result from 'true-myth/result'
import { ServerRoles } from '../../../core/constants.js'
import { ServerRoleNotFoundError } from '../authErrors.js'

export type GetServerRole = (args: {
  userId: string
}) => Promise<Result<ServerRoles, typeof ServerRoleNotFoundError>>
