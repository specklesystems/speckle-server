export class ProjectNotFoundError extends Error {
  constructor({ projectId }: { projectId: string }) {
    super(`Project with id ${projectId} not found`)
  }
}

export class InvalidRoleError extends Error {
  constructor(message: string) {
    super(message)
  }
}
