export type Project = {
  id: string
  /**
   * @deprecated
   */
  isDiscoverable: boolean
  isPublic: boolean
  workspaceId: string | null
}

export type ProjectVisibility = 'public' | 'linkShareable' | 'private'
