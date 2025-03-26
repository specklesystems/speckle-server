import { AuthCheckContext, AuthCheckContextLoaderKeys } from '../domain/loaders.js'

export const requireValidWorkspaceSsoSession =
  ({
    loaders
  }: AuthCheckContext<typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession>) =>
  async (args: { userId: string; workspaceId: string }): Promise<boolean> => {
    const { userId, workspaceId } = args

    const workspaceSsoSession = await loaders.getWorkspaceSsoSession({
      userId,
      workspaceId
    })
    if (!workspaceSsoSession.isOk) return false

    const isExpiredSession =
      new Date().getTime() > workspaceSsoSession.value.validUntil.getTime()

    return !isExpiredSession
  }
