import { Result } from 'true-myth/result'
import { StreamRoles } from '../../../core/constants.js'
import { Project } from './types.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ProjectRoleNotFoundError,
  WorkspaceSsoSessionNoAccessError
} from '../authErrors.js'

export type GetProject = (args: {
  projectId: string
}) => Promise<
  Result<
    Project,
    | InstanceType<typeof ProjectNotFoundError>
    | InstanceType<typeof ProjectNoAccessError>
    | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  >
>

export type GetProjectRole = (args: {
  userId: string
  projectId: string
}) => Promise<Result<StreamRoles, InstanceType<typeof ProjectRoleNotFoundError>>>
