import { ServerRole } from './types.js'

export type GetServerRole = (args: { userId: string }) => Promise<ServerRole | null>
