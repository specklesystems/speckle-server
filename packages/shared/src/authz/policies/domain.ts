// TODO: Sharing domain types

export type Project = {
  isPublic: boolean
  workspaceId: string | null
}

export type ProjectRole = 'stream:owner' | 'stream:contributor' | 'stream:reviewer' | 'stream:guest'

export type ServerRole = 'server:admin' | 'server:member' | 'server:guest'