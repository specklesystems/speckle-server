import type { UpdateServerInfo } from '@/modules/core/domain/server/operations'
import sanitizeHtml from 'sanitize-html'

export const updateServerInfoFactory =
  (deps: { updateServerInfo: UpdateServerInfo }): UpdateServerInfo =>
  (info) => {
    const update = {
      ...info,
      description: info.description ? sanitizeHtml(info.description) : undefined,
      termsOfService: info.termsOfService
        ? sanitizeHtml(info.termsOfService)
        : undefined,
      adminContact: info.adminContact ? sanitizeHtml(info.adminContact) : undefined,
      name: info.name ? sanitizeHtml(info.name) : undefined,
      company: info.company ? sanitizeHtml(info.company) : undefined
    }
    return deps.updateServerInfo(update)
  }
