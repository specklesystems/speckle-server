export const ProjectVisibility = <const>{
  Public: 'public',
  Private: 'private',
  Workspace: 'workspace'
}

export type ProjectVisibility =
  (typeof ProjectVisibility)[keyof typeof ProjectVisibility]

export type Project = {
  id: string
  visibility: ProjectVisibility
  workspaceId: string | null
  allowPublicComments: boolean
}
