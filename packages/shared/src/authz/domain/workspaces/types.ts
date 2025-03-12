export type Workspace = {
  id: string
}

export type WorkspaceRole = 'workspace:admin' | 'workspace:member' | 'workspace:guest'

export type WorkspaceSsoProvider = {
  providerId: string
}

export type WorkspaceSsoSession = {
  userId: string
  providerId: string
  validUntil: Date
}
