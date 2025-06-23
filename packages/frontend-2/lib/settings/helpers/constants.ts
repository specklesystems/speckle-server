import {
  Roles,
  type WorkspaceSeatType,
  SeatTypes,
  type WorkspaceRoles
} from '@speckle/shared'

export const WorkspaceRoleDescriptions: Record<string, string> = {
  [Roles.Workspace.Admin]:
    'They will be able to manage the full workspace, including settings, members, and all projects.',
  [Roles.Workspace.Member]:
    'Members can access all projects in a workspace. They can create, own and contribute to projects if assigned an Editor seat.',
  [Roles.Workspace.Guest]:
    'Guests cannot create projects, their project access is limited to select projects, and they don’t need to authenticate through SSO.'
}

export const WorkspaceSeatTypeDescription: Record<
  WorkspaceRoles | 'any',
  Record<WorkspaceSeatType, string>
> = {
  [Roles.Workspace.Admin]: {
    [SeatTypes.Editor]:
      'Members on an Editor seat can create and contribute to projects',
    [SeatTypes.Viewer]: 'Members on a Viewer seat can view and comment on projects'
  },
  [Roles.Workspace.Member]: {
    [SeatTypes.Editor]:
      'Members on an Editor seat can create and contribute to projects',
    [SeatTypes.Viewer]: 'Members on a Viewer seat can view and comment on projects'
  },
  [Roles.Workspace.Guest]: {
    [SeatTypes.Editor]:
      "Guests on an Editor seat can contribute to the projects they're invited to",
    [SeatTypes.Viewer]:
      "Guests on a Viewer seat can view and comment on the projects they're invited to"
  },
  any: {
    [SeatTypes.Editor]: 'Users on an Editor seat can create and contribute to projects',
    [SeatTypes.Viewer]: 'Users on a Viewer seat can view and comment on projects'
  }
}
