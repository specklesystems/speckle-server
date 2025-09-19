export type AccTokens = {
  access_token: string
  refresh_token: string
  token_type: string
  id_token?: string | undefined
  expires_in: number
  timestamp: number
}

export type AccUserInfo = {
  userId: string
  userName: string
  emailId: string
  firstName: string
  lastName: string
}

export type AccHub = {
  id: string
  attributes: { name: string; region: string; extension: Record<string, unknown> }
}

export type AccProject = {
  id: string
  attributes: { name: string; lastModifiedTime: string }
  relationships: Record<string, unknown>
}

export type AccItem = {
  id: string
  type?: string
  latestVersionId?: string // we mutate on the way
  fileExtension: string
  storageUrn?: string // we mutate on the way
  attributes: {
    name: string
    displayName: string
    createTime?: string
    extension?: Record<string, unknown>
    versionNumber: number
  }
}
