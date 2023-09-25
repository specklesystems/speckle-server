export type ProjectsSelectItemType = { id?: string; name: string }
export type ModelsSelectItemType = { id?: string; name: string }
export type VersionsSelectItemType = {
  id: string
  message: string
  createdAt: Date
  referencedObject: string
  sourceApplication: string
}
