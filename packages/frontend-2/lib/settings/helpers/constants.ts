import { UserUpdateActionTypes } from '~/lib/settings/helpers/types'
import { Roles } from '@speckle/shared'

type ShowOptions = {
  isActiveUserWorkspaceAdmin?: boolean
  isActiveUserCurrentUser?: boolean
  targetUserRole?: string
  targetUserSeatType?: string
}

type MenuConfig = {
  title: string
  show: (options: ShowOptions) => boolean
}

type DialogConfig = {
  title: string
  mainMessage: string | ((seatType: string) => string)
  roleInfo?: string
  buttonText: string
  editorSeatsInfo?: boolean | ((seatType: string) => boolean)
}

type ActionConfig = {
  menu: MenuConfig
  dialog: DialogConfig
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
      title: 'Make an admin?',
      mainMessage: (seatType: string) =>
        seatType === 'editor'
          ? 'They will become project owner for all existing and new workspace projects.'
          : 'They will be given an editor seat and become project owner for all existing and new workspace projects.',
      roleInfo:
        'Admins can edit workspaces, including settings, members and all projects. More about workspace roles.',
      buttonText: 'Make an admin',
      editorSeatsInfo: (seatType: string) => seatType === 'viewer'
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
      title: 'Make a guest?',
      mainMessage: 'They will lose access to all existing workspace projects.',
      roleInfo:
        "Guest can contribute to projects they're invited to. More about workspace roles.",
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
      title: 'Make a member?',
      mainMessage:
        'They will become project viewer for all existing and new workspace projects.',
      roleInfo: 'Members can create and own projects. More about workspace roles.',
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
        targetUserSeatType === 'viewer'
    },
    dialog: {
      title: 'Upgrade to an editor seat?',
      mainMessage: 'An editor seat will allow them to create new models and versions.',
      buttonText: 'Upgrade to editor',
      editorSeatsInfo: true
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
        targetUserSeatType === 'editor'
    },
    dialog: {
      title: 'Downgrade to a viewer seat?',
      mainMessage:
        'A viewer seat will allow them to view and receive model, but not send to it.',
      buttonText: 'Downgrade to viewer',
      editorSeatsInfo: true
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
      editorSeatsInfo: (seatType: string) => seatType === 'editor'
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
