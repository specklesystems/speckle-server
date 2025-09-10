import { UserInputError } from '@/modules/core/errors/userinput'
import type { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import type { Workspace } from '@/modules/workspacesCore/domain/types'

export const parseWorkspaceIdentifier = async (
  identifier: Partial<Pick<Workspace, 'id' | 'slug'>>,
  context: GraphQLContext
): Promise<Workspace> => {
  const { id, slug } = identifier

  if (!id && !slug) {
    // GraphQL @oneof asserts this at runtime, but typescript type is not narrow enough
    throw new UserInputError('Must provide either id or slug')
  }

  let workspace: Workspace | null = null

  if (id) {
    workspace = await context.loaders.workspaces!.getWorkspace.load(id)
  }

  if (slug) {
    workspace = await context.loaders.workspaces!.getWorkspaceBySlug.load(slug)
  }

  if (!workspace) {
    throw new WorkspaceNotFoundError()
  }

  return workspace
}
