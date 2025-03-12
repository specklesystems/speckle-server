import { ServerRoles } from '../../../core/constants.js'

export type GetServerRole = (args: { userId: string }) => Promise<ServerRoles | null>
