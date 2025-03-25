import {
  WorkspaceUserActionTypes,
  type WorkspaceUserActionConfig
} from '~/lib/settings/helpers/types'
import { Roles, type WorkspaceSeatType, SeatTypes } from '@speckle/shared'

export const WorkspaceRoleDescriptions: Record<string, string> = {
  [Roles.Workspace.Admin]:
    'Can edit workspaces, including settings, members and all projects',
  [Roles.Workspace.Member]: 'Can create and own projects',
  [Roles.Workspace.Guest]: "Can contribute to projects they're invited to"
}

export const WorkspaceSeatTypeDescriptions: Record<WorkspaceSeatType, string> = {
  [SeatTypes.Editor]: 'Can create new models and versions',
  [SeatTypes.Viewer]: 'Can view and receive models, but not send to them'
}

export const WorkspaceUserActionsConfig: Record<
  WorkspaceUserActionTypes,
  WorkspaceUserActionConfig
> = {
  [WorkspaceUserActionTypes.MakeAdmin]: {
    menu: {
      title: 'Make admin...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentRole !== Roles.Workspace.Admin &&
        targetUserCurrentRole !== Roles.Workspace.Guest
    },
    dialog: {
      title: 'Make an admin',
      mainMessage: (seatType) =>
        seatType === SeatTypes.Editor
          ? 'They will become project owner for all existing and new workspace projects.'
          : 'They will be given an editor seat and become project owner for all existing and new workspace projects.',
      showRoleInfo: true,
      buttonText: 'Make an admin',
      seatCountMessage: true
    }
  },
  [WorkspaceUserActionTypes.RemoveAdmin]: {
    menu: {
      title: 'Remove as admin...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentRole === Roles.Workspace.Admin
    },
    dialog: {
      title: 'Remove as admin',
      mainMessage: 'They will lose admin privileges and become a member.',
      showRoleInfo: false,
      buttonText: 'Remove as admin',
      seatCountMessage: false
    }
  },
  [WorkspaceUserActionTypes.MakeGuest]: {
    menu: {
      title: 'Make guest...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentRole !== Roles.Workspace.Guest
    },
    dialog: {
      title: 'Make a guest',
      mainMessage: 'They will lose access to all existing workspace projects.',
      showRoleInfo: true,
      buttonText: 'Make a guest'
    }
  },
  [WorkspaceUserActionTypes.MakeMember]: {
    menu: {
      title: 'Make member...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentRole,
        isDomainCompliant = false
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentRole === Roles.Workspace.Guest &&
        isDomainCompliant
    },
    dialog: {
      title: 'Make member',
      mainMessage: (seatType) =>
        seatType === SeatTypes.Editor
          ? 'They will be given a viewer seat and lose project ownership.'
          : 'They will be given a viewer seat.',
      showRoleInfo: true,
      buttonText: 'Make a member'
    }
  },
  [WorkspaceUserActionTypes.UpgradeEditor]: {
    menu: {
      title: 'Upgrade to editor seat...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentSeatType
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentSeatType === SeatTypes.Viewer
    },
    dialog: {
      title: 'Upgrade to an editor seat?',
      mainMessage: 'An editor seat will allow them to create new models and versions.',
      buttonText: 'Upgrade to editor',
      seatCountMessage: true
    }
  },
  [WorkspaceUserActionTypes.DowngradeEditor]: {
    menu: {
      title: 'Downgrade to viewer seat...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentSeatType
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentSeatType === SeatTypes.Editor
    },
    dialog: {
      title: 'Downgrade to a viewer seat?',
      mainMessage:
        'A viewer seat will allow them to view and receive model, but not send to it.',
      buttonText: 'Downgrade to viewer',
      seatCountMessage: true
    }
  },
  [WorkspaceUserActionTypes.RemoveMember]: {
    menu: {
      title: 'Remove from workspace...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentRole === 'canRemove'
    },
    dialog: {
      title: 'Remove from workspace?',
      mainMessage: 'They will lose access to all existing workspace projects.',
      buttonText: 'Remove from workspace',
      seatCountMessage: true
    }
  },
  [WorkspaceUserActionTypes.LeaveWorkspace]: {
    menu: {
      title: 'Leave workspace...',
      show: ({ isActiveUserTargetUser = false }) => isActiveUserTargetUser
    },
    dialog: {
      title: 'Leave workspace?',
      mainMessage: 'You will lose access to all existing workspace projects.',
      buttonText: 'Leave workspace'
    }
  }
} as const
