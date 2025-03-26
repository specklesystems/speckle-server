import { Roles, type WorkspaceSeatType, SeatTypes } from '@speckle/shared'

export const WorkspaceRoleDescriptions: Record<string, string> = {
  [Roles.Workspace.Admin]:
    'They will be able to manage the full workspace, including settings, members, and all projects.',
  [Roles.Workspace.Member]:
    'Members can access all projects in a workspace. They can create, own and contribute to projects if assigned an Editor seat.',
  [Roles.Workspace.Guest]:
    'Guests cannot create projects, their project access is limited to select projects, and they don’t need to authenticate through SSO.'
}

export const WorkspaceSeatTypeDescriptions: Record<WorkspaceSeatType, string> = {
  [SeatTypes.Editor]: 'Can create new models and versions',
  [SeatTypes.Viewer]: 'Can view and receive models, but not send to them'
}
