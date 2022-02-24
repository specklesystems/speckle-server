export function resourceType(resourceId) {
  return resourceId.length === 10 ? 'commit' : 'object'
}
