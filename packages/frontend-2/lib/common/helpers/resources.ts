export function isObjectId(id: string) {
  return id.length === 32
}

export const buildModelTreeItemId = (projectId: string, fullName: string) =>
  `${projectId}-${fullName}`
