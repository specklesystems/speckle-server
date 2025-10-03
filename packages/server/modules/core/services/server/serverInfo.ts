import type { UpdateServerInfo } from '@/modules/core/domain/server/operations'
import { sanitizeUserInput } from '@/modules/core/utils/input'
export const updateServerInfoFactory =
  (deps: { updateServerInfo: UpdateServerInfo }): UpdateServerInfo =>
  (info) => {
    const update = sanitizeUserInput(info)
    return deps.updateServerInfo(update)
  }
