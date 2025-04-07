import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canCreateWorkspaceProjectPolicy } from './workspace/canCreateWorkspaceProject.js'
import { canReadProjectPolicy } from './project/canReadProject.js'
import { canCreateProjectPolicy } from './project/canCreate.js'
import { canCreateModelPolicy } from './project/canCreateModel.js'
import { canMoveToWorkspacePolicy } from './project/canMoveToWorkspace.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    canRead: canReadProjectPolicy(loaders),
    canCreateLegacy: canCreateProjectPolicy(loaders),
    canCreateModel: canCreateModelPolicy(loaders),
    canMoveToWorkspace: canMoveToWorkspacePolicy(loaders)
  },
  workspace: {
    canCreateProject: canCreateWorkspaceProjectPolicy(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
