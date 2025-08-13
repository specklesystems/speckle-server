export type SavedView = {
  id: string
  name: string
  authorId: string | null
  groupId: string | null
  projectId: string
}

export type SavedViewGroup = {
  id: string
  projectId: string
  /**
   * null means default/ungrouped group
   */
  name: string | null
  authorId: string | null
  resourceIds: string[]
}
