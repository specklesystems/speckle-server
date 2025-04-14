import { StreamRoles } from '../../../core/constants.js'
import { Project } from './types.js'

export type GetProject = (args: { projectId: string }) => Promise<Project | null>

export type GetProjectRole = (args: {
  userId: string
  projectId: string
}) => Promise<StreamRoles | null>
