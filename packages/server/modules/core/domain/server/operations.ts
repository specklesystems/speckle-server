import { ServerInfo } from '@/modules/core/domain/server/types'

export type GetServerInfo = () => Promise<ServerInfo>
