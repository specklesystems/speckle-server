import { UserUpdateActionTypes, type ActionConfig } from '~/lib/settings/helpers/types'
import { Roles } from '@speckle/shared'
import { WorkspaceSeatType } from '~/lib/common/generated/gql/graphql'

export const LEARN_MORE_ROLES_SEATS_URL =
  'https://speckle.guide/user/workspaces.html#roles-and-seats'

export const WORKSPACE_ROLE_DESCRIPTIONS: Record<string, string> = {
  [Roles.Workspace.Admin]:
    'Can edit workspaces, including settings, members and all projects',
  [Roles.Workspace.Member]: 'Can create and own projects',
  [Roles.Workspace.Guest]: "Can contribute to projects they're invited to"
}

export const UPDATE_WORKSPACE_MEMBER_CONFIG: Record<
  UserUpdateActionTypes,
  ActionConfig
> = {
  [UserUpdateActionTypes.MakeAdmin]: {
    menu: {
      title: 'Make admin...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserCurrentUser,
        targetUserRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserCurrentUser &&
        targetUserRole !== Roles.Workspace.Admin &&
        targetUserRole !== Roles.Workspace.Guest
    },
    dialog: {
      title: 'Make Admin',
      mainMessage: (seatType) =>
        seatType === WorkspaceSeatType.Editor
          ? 'They will become project owner for all existing and new workspace projects.'
          : 'They will be given an editor seat and become project owner for all existing and new workspace projects.',
      showRoleInfo: true,
      buttonText: 'Make an admin',
      seatCountMessage: true
    }
  },
  [UserUpdateActionTypes.MakeGuest]: {
    menu: {
      title: 'Make guest...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserCurrentUser,
        targetUserRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserCurrentUser &&
        targetUserRole !== Roles.Workspace.Guest
    },
    dialog: {
      title: 'Make Guest',
      mainMessage: 'They will lose access to all existing workspace projects.',
      showRoleInfo: true,
      buttonText: 'Make a guest'
    }
  },
  [UserUpdateActionTypes.MakeMember]: {
    menu: {
      title: 'Make member...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserCurrentUser,
        targetUserRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserCurrentUser &&
        targetUserRole === Roles.Workspace.Guest
    },
    dialog: {
      title: 'Make Member',
      mainMessage: (seatType) =>
        seatType === WorkspaceSeatType.Editor
          ? 'They will be given a viewer seat and lose project ownership.'
          : 'They will be given a viewer seat.',
      showRoleInfo: true,
      buttonText: 'Make a member'
    }
  },
  [UserUpdateActionTypes.UpgradeEditor]: {
    menu: {
      title: 'Upgrade to editor seat...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserCurrentUser,
        targetUserSeatType
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserCurrentUser &&
        targetUserSeatType === WorkspaceSeatType.Viewer
    },
    dialog: {
      title: 'Upgrade to an editor seat?',
      mainMessage: 'An editor seat will allow them to create new models and versions.',
      buttonText: 'Upgrade to editor',
      seatCountMessage: true
    }
  },
  [UserUpdateActionTypes.DowngradeEditor]: {
    menu: {
      title: 'Downgrade to viewer seat...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserCurrentUser,
        targetUserSeatType
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserCurrentUser &&
        targetUserSeatType === WorkspaceSeatType.Editor
    },
    dialog: {
      title: 'Downgrade to a viewer seat?',
      mainMessage:
        'A viewer seat will allow them to view and receive model, but not send to it.',
      buttonText: 'Downgrade to viewer',
      seatCountMessage: true
    }
  },
  [UserUpdateActionTypes.RemoveMember]: {
    menu: {
      title: 'Remove from workspace...',
      show: ({
        isActiveUserWorkspaceAdmin = false,
        isActiveUserCurrentUser,
        targetUserRole
      }) =>
        isActiveUserWorkspaceAdmin &&
        !isActiveUserCurrentUser &&
        targetUserRole === 'canRemove'
    },
    dialog: {
      title: 'Remove from workspace?',
      mainMessage: 'They will lose access to all existing workspace projects.',
      buttonText: 'Remove from workspace',
      seatCountMessage: true
    }
  },
  [UserUpdateActionTypes.LeaveWorkspace]: {
    menu: {
      title: 'Leave workspace...',
      show: ({ isActiveUserCurrentUser = false }) => isActiveUserCurrentUser
    },
    dialog: {
      title: 'Leave workspace?',
      mainMessage: 'You will lose access to all existing workspace projects.',
      buttonText: 'Leave workspace'
    }
  }
} as const
