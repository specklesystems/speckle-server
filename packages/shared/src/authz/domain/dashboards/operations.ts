import { Dashboard } from './types.js'

export type GetDashboard = (args: { dashboardId: string }) => Promise<Dashboard | null>
