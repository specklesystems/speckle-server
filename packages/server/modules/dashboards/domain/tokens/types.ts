export type DashboardApiTokenRecord = {
  tokenId: string
  dashboardId: string
  userId: string
  content: string
}

export type DashboardApiToken = DashboardApiTokenRecord & {
  createdAt: Date
  lastUsed: Date
  lifespan: number | bigint
}
