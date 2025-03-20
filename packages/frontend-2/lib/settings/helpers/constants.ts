import {
  WorkspaceUserUpdateActionTypes,
  type WorkspaceUserUpdateActionConfig
} from '~/lib/settings/helpers/types'
import { Roles } from '@speckle/shared'
import { WorkspaceSeatType } from '~/lib/common/generated/gql/graphql'

// TODO: Add link when ready
export const LearnMoreRolesSeatsUrl = 'https://speckle.guide/'

export const WorkspaceRoleDescriptions: Record<string, string> = {
  [Roles.Workspace.Admin]:
    'Can edit workspaces, including settings, members and all projects',
  [Roles.Workspace.Member]: 'Can create and own projects',
  [Roles.Workspace.Guest]: "Can contribute to projects they're invited to"
}

export const WorkspaceSeatTypeDescriptions: Record<WorkspaceSeatType, string> = {
  [WorkspaceSeatType.Editor]: 'Can create new models and versions',
  [WorkspaceSeatType.Viewer]: 'Can view and receive models, but not send to them'
}

export const WorkspaceUserUpdateConfig: Record<
  WorkspaceUserUpdateActionTypes,
  WorkspaceUserUpdateActionConfig
> = {
  [WorkspaceUserUpdateActionTypes.MakeAdmin]: {
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
        seatType === WorkspaceSeatType.Editor
          ? 'They will become project owner for all existing and new workspace projects.'
          : 'They will be given an editor seat and become project owner for all existing and new workspace projects.',
      showRoleInfo: true,
      buttonText: 'Make an admin',
      seatCountMessage: true
    }
  },
  [WorkspaceUserUpdateActionTypes.RemoveAdmin]: {
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
  [WorkspaceUserUpdateActionTypes.MakeGuest]: {
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
  [WorkspaceUserUpdateActionTypes.MakeMember]: {
    menu: {
      title: 'Make member...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentRole === Roles.Workspace.Guest
    },
    dialog: {
      title: 'Make member',
      mainMessage: (seatType) =>
        seatType === WorkspaceSeatType.Editor
          ? 'They will be given a viewer seat and lose project ownership.'
          : 'They will be given a viewer seat.',
      showRoleInfo: true,
      buttonText: 'Make a member'
    }
  },
  [WorkspaceUserUpdateActionTypes.UpgradeEditor]: {
    menu: {
      title: 'Upgrade to editor seat...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentSeatType
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentSeatType === WorkspaceSeatType.Viewer
    },
    dialog: {
      title: 'Upgrade to an editor seat?',
      mainMessage: 'An editor seat will allow them to create new models and versions.',
      buttonText: 'Upgrade to editor',
      seatCountMessage: true
    }
  },
  [WorkspaceUserUpdateActionTypes.DowngradeEditor]: {
    menu: {
      title: 'Downgrade to viewer seat...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserTargetUser,
        targetUserCurrentSeatType
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserTargetUser &&
        targetUserCurrentSeatType === WorkspaceSeatType.Editor
    },
    dialog: {
      title: 'Downgrade to a viewer seat?',
      mainMessage:
        'A viewer seat will allow them to view and receive model, but not send to it.',
      buttonText: 'Downgrade to viewer',
      seatCountMessage: true
    }
  },
  [WorkspaceUserUpdateActionTypes.RemoveMember]: {
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
  [WorkspaceUserUpdateActionTypes.LeaveWorkspace]: {
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
