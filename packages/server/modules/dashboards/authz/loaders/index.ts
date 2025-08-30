import { db } from '@/db/knex'
import { getDashboardRecordFactory } from '@/modules/dashboards/repositories/management'
import { defineModuleLoaders } from '@/modules/loaders'

export default defineModuleLoaders(async () => {
  const getDashboard = getDashboardRecordFactory({ db })

  return {
    getDashboard: async ({ dashboardId }) => {
      return (await getDashboard({ id: dashboardId })) ?? null
    }
  }
})
