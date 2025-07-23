import type { GetTotalModelCount } from '@/modules/core/domain/branches/operations'
import type { GetTotalVersionCount } from '@/modules/core/domain/commits/operations'
import type { GetServerInfo } from '@/modules/core/domain/server/operations'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import type { getMixpanelClient } from '@/modules/shared/utils/mixpanel'
import type {
  getTotalStreamCountFactory,
  getTotalUserCountFactory
} from '@/modules/stats/repositories'
import type { GetTotalWorkspaceCountFactory } from '@/modules/workspacesCore/domain/operations'
import { resolveMixpanelServerId } from '@speckle/shared'
import type { Logger } from 'pino'

export const updateServerMixpanelProfileFactory =
  (deps: {
    getMixpanelClient: typeof getMixpanelClient
    getServerInfo: GetServerInfo
    getTotalStreamCount: ReturnType<typeof getTotalStreamCountFactory>
    getTotalUserCount: ReturnType<typeof getTotalUserCountFactory>
    getTotalWorkspaceCount: GetTotalWorkspaceCountFactory
    getServerTotalModelCount: GetTotalModelCount
    getServerTotalVersionCount: GetTotalVersionCount
    logger: Logger
  }) =>
  async () => {
    const mp = deps.getMixpanelClient()
    if (!mp) return

    const [
      serverInfo,
      streamCount,
      userCount,
      workspaceCount,
      modelCount,
      versionCount
    ] = await Promise.all([
      deps.getServerInfo(),
      deps.getTotalStreamCount(),
      deps.getTotalUserCount(),
      deps.getTotalWorkspaceCount(),
      deps.getServerTotalModelCount(),
      deps.getServerTotalVersionCount()
    ])
    const hostname = new URL(getServerOrigin()).hostname

    const properties = {
      URL: hostname,
      Company: serverInfo.company || null,
      $name: serverInfo.name || 'Speckle Server',
      $email: serverInfo.adminContact || null,
      Description: serverInfo.description || null,
      Version: serverInfo.version || null,
      'Invite Only': serverInfo.inviteOnly || false,
      'Guest Mode Enabled': serverInfo.guestModeEnabled || false,
      'Workspace Count': workspaceCount,
      'Project Count': streamCount,
      'Model Count': modelCount,
      'Version Count': versionCount,
      'User Count': userCount
    }

    const serverId = resolveMixpanelServerId(hostname)
    mp.groups.set('server_id', serverId, properties)
    deps.logger.info(
      {
        serverId,
        properties
      },
      'Updated server mp profile'
    )
  }
