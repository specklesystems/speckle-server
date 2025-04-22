export type Project = {
  id: string
  /**
   * @deprecated
   */
  isDiscoverable: boolean
  isPublic: boolean
  workspaceId: string | null
  allowPublicComments: boolean
}

export type ProjectVisibility = 'public' | 'linkShareable' | 'private'
