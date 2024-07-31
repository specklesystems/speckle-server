import {
  AvailableRoles,
  ServerRoles,
  StreamRoles,
  WorkspaceRoles,
  ServerScope
} from '@speckle/shared'

export type UserRoleData<T extends AvailableRoles> = {
  description: string
  weight: number
  public: boolean
  name: T
}

export type UserServerRole = UserRoleData<ServerRoles> & {
  resourceTarget: 'server'
  aclTableName: 'server_acl'
}

export type UserStreamRole = UserRoleData<StreamRoles> & {
  resourceTarget: 'streams'
  aclTableName: 'stream_acl'
  name: StreamRoles
}

export type UserWorkspaceRole = UserRoleData<WorkspaceRoles> & {
  resourceTarget: 'workspaces'
  aclTableName: 'workspace_acl'
  name: WorkspaceRoles
}

export type UserRole = UserServerRole | UserStreamRole | UserWorkspaceRole

export type TokenScopeData = {
  name: ServerScope
  description: string
  public: boolean
}
