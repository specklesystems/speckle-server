import { ChuckContext } from '../domain/loaders.js'
import { CheckResult } from '../domain/types.js'
import { checkResult } from '../helpers/result.js'

export const requireValidWorkspaceSsoSession =
  ({ loaders }: ChuckContext<'getWorkspaceSsoSession'>) =>
  async (args: { userId: string; workspaceId: string }): Promise<CheckResult> => {
    const { userId, workspaceId } = args

    const workspaceSsoSession = await loaders.getWorkspaceSsoSession({
      userId,
      workspaceId
    })

    const isExpiredSession =
      new Date().getTime() > (workspaceSsoSession?.validUntil?.getTime() ?? 0)

    return !!workspaceSsoSession && !isExpiredSession
      ? checkResult.pass()
      : checkResult.fail('User does not have a valid SSO session for workspace.')
  }
