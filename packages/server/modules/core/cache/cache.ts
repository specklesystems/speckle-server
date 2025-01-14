import { ServerConfigRecord } from '@/modules/core/helpers/types'
import TTLCache from '@isaacs/ttlcache'

let serverConfigCache: TTLCache<string, ServerConfigRecord> | undefined

export const getServerConfigCache = () => {
  if (!serverConfigCache)
    serverConfigCache = new TTLCache<string, ServerConfigRecord>({
      max: 1,
      ttl: 60 * 1000
    })

  return serverConfigCache
}
