import { AllAuthCheckContextLoaders } from '../domain/loaders.js'
import { canCreateWorkspaceProjectPolicy } from './workspace/canCreateWorkspaceProject.js'
import { canReadProjectPolicy } from './project/canReadProject.js'
import { canCreatePersonalProjectPolicy } from './project/canCreatePersonal.js'
import { canUpdateProjectPolicy } from './project/canUpdate.js'

export const authPoliciesFactory = (loaders: AllAuthCheckContextLoaders) => ({
  project: {
    canRead: canReadProjectPolicy(loaders),
    canCreatePersonal: canCreatePersonalProjectPolicy(loaders),
    canUpdate: canUpdateProjectPolicy(loaders)
  },
  workspace: {
    canCreateProject: canCreateWorkspaceProjectPolicy(loaders)
  }
})

export type AuthPolicies = ReturnType<typeof authPoliciesFactory>
