export type SavedViewGroupApiTokenRecord = {
  tokenId: string
  projectId: string
  savedViewGroupId: string
  userId: string
  content: string
}

export type SavedViewGroupApiToken = SavedViewGroupApiTokenRecord & {
  createdAt: Date
  lastUsed: Date
  lifespan: number | bigint
  revoked: boolean
}
