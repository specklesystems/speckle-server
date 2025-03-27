export type Project = {
  isDiscoverable: boolean
  isPublic: boolean
  workspaceId: string | null
}

export type ProjectVisibility = 'public' | 'linkShareable' | 'private'
