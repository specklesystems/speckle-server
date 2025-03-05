import { Project, ProjectRole, ServerRole } from "./domain.js"

export type GetProject = (args: {
  projectId: string
}) => Promise<Project | null>

export type GetProjectRole = (args: {
  userId: string
  projectId: string
}) => Promise<ProjectRole>

export type GetServerRole = (args: {
  userId: string
}) => Promise<ServerRole>