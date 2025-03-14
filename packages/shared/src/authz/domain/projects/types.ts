export type Project = {
  // TODO: Deprecated field?
  isDiscoverable: boolean
  isPublic: boolean
  workspaceId: string | null
}

export type ProjectVisibility = 'public' | 'linkShareable' | 'private'
