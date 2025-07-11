export type AutomateFunction = {
  id: string
  name: string
  functionCreator: {
    speckleUserId: string
    speckleServerOrigin: string
  } | null
  workspaceIds: string[]
}
