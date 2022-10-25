export type ResourceType = 'commit' | 'object'

export function getResourceType(resourceId: string): ResourceType {
  return resourceId.length === 10 ? 'commit' : 'object'
}
