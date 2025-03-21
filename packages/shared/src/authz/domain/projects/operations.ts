import { StreamRoles } from '../../../core/constants.js'
import { Project } from './types.js'

// TODO: this should probably just throw an error if the project doesn't exist
export type GetProject = (args: { projectId: string }) => Promise<Project | null>

export type GetProjectRole = (args: {
  userId: string
  projectId: string
}) => Promise<StreamRoles | null>
