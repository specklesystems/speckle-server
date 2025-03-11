import { requireMinimumWorkspaceRole } from "../checks/workspaceRole.js"
import { GetServerRole } from "../domain/core/operations.js"
import { GetProject, GetProjectRole } from "../domain/projects/operations.js"
import { AuthResult } from "../domain/types.js"
import { GetWorkspaceRole } from "../domain/workspaces/operations.js"
import { requireExactProjectVisibility } from '../checks/projects.js'
import { ChuckContextLoaders } from "../domain/loaders.js"


type UserContext = { userId: string }
type ProjectContext = { projectId: string }

// type CanUpdateProjectPolicy = (params: { userId: string, projectId: string }) => Promise<AuthResult>

export const canReadProjectPolicyFactory = (loaders: Pick<ChuckContextLoaders, 'getProject'>) =>
  async ({ userId, projectId }: UserContext & ProjectContext): Promise<AuthResult> => {


    const project = await loaders.getProject({ projectId })
    if (!project) return {
      authorized: false,
      reason: userId
    }

    const isPublic = await requireExactProjectVisibility({ loaders })({ projectId, projectVisibility: 'public' })
    if (!isPublic) {
      return isPublic
    }

    const isLinkShareable = await requireExactProjectVisibility({ loaders })({ projectId, projectVisibility: 'linkShareable' })
    if (!isLinkShareable) {
      return isLinkShareable
    }

    if (project.workspaceId) {
      const h
    }



    return { authorized: true }

    requireMinimumWorkspaceRole({ role: '' })

  }


export const authPolicyFactory = (loaders: ChuckContextLoaders) => ({
  canReadProject: canReadProjectPolicyFactory(loaders),
})

export type AuthPolices = ReturnType<typeof authPolicyFactory>