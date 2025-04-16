import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canCreateWorkspaceProjectPolicy } from './workspace/canCreateWorkspaceProject.js'
import { canReadProjectPolicy } from './project/canRead.js'
import { canCreateModelPolicy } from './project/model/canCreate.js'
import { canMoveToWorkspacePolicy } from './project/canMoveToWorkspace.js'
import { canCreatePersonalProjectPolicy } from './project/canCreatePersonal.js'
import { canUpdateProjectPolicy } from './project/canUpdate.js'
import { canReadProjectSettingsPolicy } from './project/canReadSettings.js'
import { canReadProjectWebhooksPolicy } from './project/canReadWebhooks.js'
import { canUpdateProjectAllowPublicCommentsPolicy } from './project/canUpdateAllowPublicComments.js'
import { canLeaveProjectPolicy } from './project/canLeave.js'
import { canBroadcastProjectActivityPolicy } from './project/canBroadcastActivity.js'
import { canCreateProjectCommentPolicy } from './project/comment/canCreate.js'
import { canArchiveProjectCommentPolicy } from './project/comment/canArchive.js'
import { canEditProjectCommentPolicy } from './project/comment/canEdit.js'
import { canUpdateModelPolicy } from './project/model/canUpdate.js'
import { canDeleteModelPolicy } from './project/model/canDelete.js'
import { canCreateProjectVersionPolicy } from './project/version/canCreate.js'
import { canUpdateProjectVersionPolicy } from './project/version/canUpdate.js'
import { canReceiveProjectVersionPolicy } from './project/version/canReceive.js'
import { canRequestProjectVersionRenderPolicy } from './project/version/canRequestRender.js'
import { canReceiveWorkspaceProjectsUpdatedMessagePolicy } from './workspace/canReceiveProjectsUpdatedMessage.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    model: {
      canCreate: canCreateModelPolicy(loaders),
      canUpdate: canUpdateModelPolicy(loaders),
      canDelete: canDeleteModelPolicy(loaders)
    },
    comment: {
      canCreate: canCreateProjectCommentPolicy(loaders),
      canArchive: canArchiveProjectCommentPolicy(loaders),
      canEdit: canEditProjectCommentPolicy(loaders)
    },
    version: {
      canCreate: canCreateProjectVersionPolicy(loaders),
      canUpdate: canUpdateProjectVersionPolicy(loaders),
      canReceive: canReceiveProjectVersionPolicy(loaders),
      canRequestRender: canRequestProjectVersionRenderPolicy(loaders)
    },
    canBroadcastActivity: canBroadcastProjectActivityPolicy(loaders),
    canRead: canReadProjectPolicy(loaders),
    canMoveToWorkspace: canMoveToWorkspacePolicy(loaders),
    canCreatePersonal: canCreatePersonalProjectPolicy(loaders),
    canUpdate: canUpdateProjectPolicy(loaders),
    canUpdateAllowPublicComments: canUpdateProjectAllowPublicCommentsPolicy(loaders),
    canReadSettings: canReadProjectSettingsPolicy(loaders),
    canReadWebhooks: canReadProjectWebhooksPolicy(loaders),
    canLeave: canLeaveProjectPolicy(loaders)
  },
  workspace: {
    canCreateProject: canCreateWorkspaceProjectPolicy(loaders),
    canReceiveProjectsUpdatedMessage:
      canReceiveWorkspaceProjectsUpdatedMessagePolicy(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
