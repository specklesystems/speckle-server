import { WorkspaceInvalidUpdateError } from '@/modules/workspaces/errors/workspace'

export const validateImageString = (imageString: string): void => {
  // Validate string is a reasonable size
  if (new TextEncoder().encode(imageString).length > 1024 * 1024 * 10) {
    throw new WorkspaceInvalidUpdateError('Provided logo must be smaller than 10 MB')
  }

  // Validate string is base64 image
  const [prefix, ...rest] = imageString.split(',')
  const imageData = rest.pop()

  if (!prefix || !prefix.startsWith('data:image') || !imageData) {
    throw new WorkspaceInvalidUpdateError('Provided logo is malformed')
  }

  if (Buffer.from(imageData, 'base64').toString('base64') !== imageData) {
    throw new WorkspaceInvalidUpdateError('Provided logo is malformed')
  }
}
