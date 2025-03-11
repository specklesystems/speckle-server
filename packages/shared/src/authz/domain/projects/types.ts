export type Project = {
  // TODO: Deprecated field?
  isDiscoverable: boolean
  isPublic: boolean
  workspaceId: string | null
}

export type ProjectRole =
  | 'stream:owner'
  | 'stream:contributor'
  | 'stream:reviewer'
  | 'stream:guest'

export type ProjectVisibility = 'public' | 'linkShareable' | 'private'
