export type Workspace = {
  id: string
  slug: string
}

export type WorkspaceSsoProvider = {
  providerId: string
}

export type WorkspaceSsoSession = {
  userId: string
  providerId: string
  validUntil: Date
}
