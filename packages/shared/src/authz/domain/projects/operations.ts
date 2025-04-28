import { StreamRoles } from '../../../core/constants.js'
import { Project } from './types.js'

export type GetProject = (args: { projectId: string }) => Promise<Project | null>

export type GetProjectRole = (args: {
  userId: string
  projectId: string
}) => Promise<StreamRoles | null>

export type GetProjectRoleCounts = (args: {
  projectId: string
  role: StreamRoles
}) => Promise<number>

export type GetProjectModelCount = (args: { projectId: string }) => Promise<number>
