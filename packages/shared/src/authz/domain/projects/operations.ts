import { Project, ProjectRole } from './types.js'

export type GetProject = (args: { projectId: string }) => Promise<Project | null>

export type GetProjectRole = (args: {
  userId: string
  projectId: string
}) => Promise<ProjectRole | null>
