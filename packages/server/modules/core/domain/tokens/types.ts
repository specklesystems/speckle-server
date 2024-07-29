export const TokenResourceIdentifierType = {
  Project: 'project',
  Workspace: 'workspace'
} as const

export type TokenResourceIdentifierType =
  (typeof TokenResourceIdentifierType)[keyof typeof TokenResourceIdentifierType]

// TODO: these should be moved to domain
export type TokenResourceIdentifier = { id: string; type: TokenResourceIdentifierType }
