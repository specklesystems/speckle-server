import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canCreateWorkspaceProjectPolicy } from './workspace/canCreateWorkspaceProject.js'
import { canReadProjectPolicy } from './project/canReadProject.js'
import { canCreateModelPolicy } from './project/model/canCreateModel.js'
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

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    model: {
      canCreate: canCreateModelPolicy(loaders)
    },
    comment: {
      canCreate: canCreateProjectCommentPolicy(loaders),
      canArchive: canArchiveProjectCommentPolicy(loaders),
      // edit/archive - same check
      canEdit: canArchiveProjectCommentPolicy(loaders)
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
    canCreateProject: canCreateWorkspaceProjectPolicy(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
