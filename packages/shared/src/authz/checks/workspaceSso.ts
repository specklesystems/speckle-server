import { ChuckContext } from '../domain/loaders.js'

export const requireValidWorkspaceSsoSession =
  ({ loaders }: ChuckContext<'getWorkspaceSsoSession'>) =>
  async (args: { userId: string; workspaceId: string }): Promise<boolean> => {
    const { userId, workspaceId } = args

    const workspaceSsoSession = await loaders.getWorkspaceSsoSession({
      userId,
      workspaceId
    })

    const isExpiredSession =
      new Date().getTime() > (workspaceSsoSession?.validUntil?.getTime() ?? 0)

    return !!workspaceSsoSession && !isExpiredSession
  }
