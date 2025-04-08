import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canCreateWorkspaceProjectPolicy } from './workspace/canCreateWorkspaceProject.js'
import { canReadProjectPolicy } from './project/canReadProject.js'
import { canCreateModelPolicy } from './project/canCreateModel.js'
import { canMoveToWorkspacePolicy } from './project/canMoveToWorkspace.js'
import { canCreatePersonalProjectPolicy } from './project/canCreatePersonal.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    canRead: canReadProjectPolicy(loaders),
    canCreateModel: canCreateModelPolicy(loaders),
    canMoveToWorkspace: canMoveToWorkspacePolicy(loaders),
    canCreatePersonal: canCreatePersonalProjectPolicy(loaders)
  },
  workspace: {
    canCreateProject: canCreateWorkspaceProjectPolicy(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
