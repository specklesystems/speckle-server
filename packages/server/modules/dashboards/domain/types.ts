export type Dashboard = {
  id: string
  name: string
  workspaceId: string
  // TODO: Shortcut for permissions when sharing
  projectIds: string[]
  // TODO: Replace with some sort of acl concept
  ownerId: string
  // TODO: Anything other than this
  state?: string
  createdAt: Date
  updatedAt: Date
}
