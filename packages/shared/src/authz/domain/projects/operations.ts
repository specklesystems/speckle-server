import { Result } from 'true-myth/result'
import { StreamRoles } from '../../../core/constants.js'
import { Project } from './types.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ProjectRoleNotFoundError
} from '../authErrors.js'

export type GetProject = (args: {
  projectId: string
}) => Promise<
  Result<Project, typeof ProjectNotFoundError | typeof ProjectNoAccessError>
>

export type GetProjectRole = (args: {
  userId: string
  projectId: string
}) => Promise<Result<StreamRoles, typeof ProjectRoleNotFoundError>>
