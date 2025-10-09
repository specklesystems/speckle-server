import type { UpdateServerInfo } from '@/modules/core/domain/server/operations'
import { sanitizeString } from '@/modules/core/utils/sanitization'

export const updateServerInfoFactory =
  (deps: { updateServerInfo: UpdateServerInfo }): UpdateServerInfo =>
  (info) => {
    const update = {
      ...info,
      description: sanitizeString(info.description),
      termsOfService: sanitizeString(info.termsOfService),
      adminContact: sanitizeString(info.adminContact),
      name: sanitizeString(info.name),
      company: sanitizeString(info.company)
    }
    return deps.updateServerInfo(update)
  }
