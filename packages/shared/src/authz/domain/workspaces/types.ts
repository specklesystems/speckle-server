export type Workspace = {
  id: string
}

export type WorkspaceSsoProvider = {
  providerId: string
}

export type WorkspaceSsoSession = {
  userId: string
  providerId: string
  validUntil: Date
}
