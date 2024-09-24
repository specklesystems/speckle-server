export type ResourceIdentifier = {
  resourceId: string
  resourceType: ResourceType
}

export enum ResourceType {
  Comment = 'comment',
  Commit = 'commit',
  Object = 'object',
  Stream = 'stream'
}
