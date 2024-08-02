import { WorkspaceInvalidLogoError } from '@/modules/workspaces/errors/workspace'

export const validateImageString = (image: string): void => {
  // Validate string is a reasonable size
  if (new TextEncoder().encode(image).length > 1024 * 1024 * 10) {
    throw new WorkspaceInvalidLogoError('Provided logo is too large')
  }

  // Validate string is base64
  if (Buffer.from(image, 'base64').toString('base64') !== image) {
    throw new WorkspaceInvalidLogoError('Provided logo is malformed')
  }

  // TODO: Validate string is image?
}
