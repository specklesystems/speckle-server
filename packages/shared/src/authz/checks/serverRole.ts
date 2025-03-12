import { ServerRole } from '../domain/core/types.js'
import { ChuckContext } from '../domain/loaders.js'
import { CheckResult } from '../domain/types.js'
import { checkResult } from '../helpers/result.js'

export const requireExactServerRole =
  ({ loaders }: ChuckContext<'getServerRole'>) =>
  async (args: { userId: string; role: ServerRole }): Promise<CheckResult> => {
    const { userId, role: requiredServerRole } = args

    const userServerRole = await loaders.getServerRole({ userId })

    return userServerRole === requiredServerRole
      ? checkResult.pass()
      : checkResult.fail(
          `User does not have required server role \`${requiredServerRole}\``
        )
  }
